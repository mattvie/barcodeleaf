#!/bin/bash

STACK_NAME=barcodeleaf-site

# Função para mostrar o uso
usage() {
    echo "Usage: $0 [--update]"
    exit 1
}

# Verifica se a flag --update foi passada
UPDATE_STACK=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --update) UPDATE_STACK=true ;;
        *) usage ;;
    esac
    shift
done

npm run build -- --clean cache
# Obter o status da stack
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].StackStatus" --output text 2>/dev/null)
empty_bucket() {
    local bucket_name=$1
    echo "Emptying bucket $bucket_name..."
    aws s3 rm s3://$bucket_name --recursive
}

# Se a stack não existir, crie-a
if [ -z "$STACK_STATUS" ]; then
    echo "Stack does not exist. Creating stack..."
    aws cloudformation create-stack --stack-name $STACK_NAME --template-body file://cloudformation-template.yaml --capabilities CAPABILITY_NAMED_IAM
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME
    echo "Stack created."
else
    # Verificar se a stack está em ROLLBACK_COMPLETE
    if [ "$STACK_STATUS" == "ROLLBACK_COMPLETE" ]; then
        BUCKET_NAME=$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --query "StackResources[?ResourceType=='AWS::S3::Bucket'].PhysicalResourceId" --output text)
        if [ ! -z "$BUCKET_NAME" ]; then
            empty_bucket $BUCKET_NAME
        fi
        aws cloudformation delete-stack --stack-name $STACK_NAME
        echo "Stack in ROLLBACK_COMPLETE state. Deleting stack..."
        aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME
        echo "Stack deleted. Recreating stack..."
        aws cloudformation create-stack --stack-name $STACK_NAME --template-body file://cloudformation-template.yaml --capabilities CAPABILITY_NAMED_IAM
        aws cloudformation wait stack-create-complete --stack-name $STACK_NAME
        echo "Stack recreated."

    elif [[ "$STACK_STATUS" == "CREATE_COMPLETE" || "$STACK_STATUS" == "UPDATE_COMPLETE" || "$STACK_STATUS" == "UPDATE_ROLLBACK_COMPLETE" ]]; then
        echo "Stack is up."


        # Se a flag de atualização foi passada, atualize a stack
        if [ "$UPDATE_STACK" = true ]; then
            echo "Updating stack..."
            aws cloudformation update-stack --stack-name $STACK_NAME --template-body file://cloudformation-template.yaml --capabilities CAPABILITY_NAMED_IAM
            aws cloudformation wait stack-update-complete --stack-name $STACK_NAME
            echo "Stack updated."
        fi
    else
        echo "Stack is in an unknown state: $STACK_STATUS. Exiting."
        exit 1
    fi
fi

# Obter o nome do bucket
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

if [ -z "$BUCKET_NAME" ]; then
    echo "Failed to get the bucket name."
    exit 1
fi

# Verificar se o diretório build existe
if [ ! -d "./build" ]; then
    echo "The user-provided path ./build/ does not exist."
    exit 1
fi

# Sincronizar arquivos com o S3
aws s3 sync ./build/ s3://$BUCKET_NAME/ 

# Obter o nome do domínio da distribuição do CloudFront
DISTRIBUTION_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomainName'].OutputValue" \
  --output text)

if [ -z "$DISTRIBUTION_URL" ]; then
    echo "Failed to get the distribution URL."
    exit 1
fi

# Obter o ID da distribuição do CloudFront
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text)

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
    echo "Warning: Failed to get the distribution ID. Skipping cache invalidation."
else
    echo "Creating CloudFront invalidation..."
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    echo "Invalidation created."
fi


echo "Application URL: http://$DISTRIBUTION_URL"
