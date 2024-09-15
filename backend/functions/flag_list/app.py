import json

import boto3


dynamo_resource = boto3.resource('dynamodb')
table = dynamo_resource.table(None)


def lambda_handler(event, context):
    '''Description'''

    flags_dict = None
    

    return {
        'statusCode': 200,
        'body': json.dumps({'flags': flags_dict})
    }