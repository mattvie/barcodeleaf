param (
    [Alias("fn", "name")]
    [Parameter(Mandatory=$true)]
    [string]$FunctionName,

    [Alias("tf", "t")]
    [string]$TemplateFile="./template.yml",

    [Alias("af", "api")]
    [string]$ApiFile = "./admin_prod.yaml",

    [Alias("end")]
    [Parameter(Mandatory=$true)]
    [string]$Endpoint,

    [alias("f", "-force")]
    [switch]$Force
)

$newApiYaml = @"
paths:
  $($Endpoint):
    post:
      responses:
        "200":
          description: "200 response"
          content:
            application/json:
              schema:
                `$ref: "#/components/schemas/Empty"
      x-amazon-apigateway-integration:
        httpMethod: "POST"
        uri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:201383159504:function:$FunctionName/invocations"
        responses:
          default:
            statusCode: "200"
        passthroughBehavior: "when_no_match"
        contentHandling: "CONVERT_TO_TEXT"
        type: "aws_proxy"
    options:
      responses:
        "200":
          description: "200 response"
          headers:
            Access-Control-Allow-Origin:
              schema:
                type: "string"
            Access-Control-Allow-Methods:
              schema:
                type: "string"
            Access-Control-Allow-Headers:
              schema:
                type: "string"
          content:
            application/json:
              schema:
                `$ref: "#/components/schemas/Empty"
      x-amazon-apigateway-integration:
        responses:
          default:
            statusCode: "200"
            responseParameters:
              method.response.header.Access-Control-Allow-Methods: "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'"
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Origin: "'*'"
        requestTemplates:
          application/json: "{\"statusCode\": 200}"
        passthroughBehavior: "when_no_match"
        type: "mock"
  
"@

# Leitura do template existente como texto
$templateContent = Get-Content -Path $TemplateFile -Raw
$yamlTemplateContent = $templateContent | ConvertFrom-Yaml
# Valida se função existe
if ($templateContent -notmatch "FunctionName: $FunctionName" -and -not $Force) {
    $Ignore = Read-Host "Aparentemente a função não existe na aplicação, ainda deseja criar o endpoint na API?"
    if($Ignore -notin @("s", "S")){
        Exit
    }
}

$functionEventName = $Endpoint -replace "/", ""
$eventProperties = [ordered]@{
    Type = "Api"
    Properties = [ordered]@{
        RestApiId = "!Ref AdminProdStage"
        Path = $Endpoint
        Method = "post"
    }
}

foreach ($resource in $yamlTemplateContent.Resources.PSObject.Properties) {
    if ($resource.Value.Type -eq 'AWS::Serverless::Function' -and $resource.Value.Properties.FunctionName -eq $FunctionName) {
        # Adicionar o novo evento
        if (-not $resource.Value.Properties.Events) {
            $resource.Value.Properties.Events = @{}
        }
        $resource.Value.Properties.Events.$functionEventName = $eventProperties
        # Salvar o template atualizado de volta ao arquivo YAML
        $yamlTemplateContent | ConvertTo-Yaml | Set-Content -Path $TemplateFile
        Write-Host "Event '$functionEventName' added to function '$FunctionName'."
        return
    }
}
Write-Host "Function '$FunctionName' does not exist in the template."
# Salvar o template modificado de volta ao arquivo
$yamlTemplateContent | Set-Content -Path $TemplateFile

Write-Host "Endpoint da função $FunctionName atualizado no template SAM."

# Leitura do arquivo de API existente como texto
$apiContent = Get-Content -Path $ApiFile -Raw

# Verificar se o endpoint já está presente no arquivo de API
if ($apiContent -match "$($Endpoint):") {
    Write-Error "O endpoint já existe nessa API, a aplicação está sendo encerrada."
    Exit
}

# Realiza a inserção 
$apiContent = $apiContent -replace "(paths:\s*)", $newApiYaml

# Salvar o arquivo de API modificado de volta ao arquivo
$apiContent | Set-Content -Path $ApiFile

Write-Host "Endpoint $Endpoint atualizado na especificação da API."

