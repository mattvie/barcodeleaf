param (
    [alias("fn", "name")]
    [Parameter(Mandatory=$true)]
    [string]$FunctionName,
    [alias("tf", "t")]
    [string]$TemplateFile="./template.yml",
    [alias("af", "api")]
    [string]$ApiFile="./admin_prod.yaml",
    [alias("l", "layers", "lay")]
    [string[]]$Layers=@(),
    [alias("r", "role")]
    [string]$Role="arn:aws:iam::201383159504:role/LambdaDynamoDBRole",
    [alias("end")]
    [string]$Endpoint,
    [alias("f", "-force")]
    [switch]$Force
)

# Leitura do template existente como texto
$templateContent = Get-Content -Path $TemplateFile -Raw

# Valida sobrescrita
if ($templateContent -match "FunctionName: $FunctionName" -and -not $Force) {
    $Override = Read-Host "Aparentemente a função já existe, deseja sobrescrever?"
    if($Override -notin @("s", "S")){
        Exit
    }
}

$resourceID = $FunctionName -replace "_", ""
# Definir a string YAML da nova função
$newFunctionYaml = @"
$($resourceID):
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: $FunctionName
      CodeUri: functions/$FunctionName
      Role: $Role
      $(if($Layers){
        "Layers:"
        foreach ($layer in $Layers) { "`n        - $layer" }
      })
      $(if($Endpoint){
        "Events:"
        "`n        $($resourceID):"
        "`n          Type: Api"
        "`n          Properties:"
        "`n            RestApiId: !Ref AdminProdStage"
        "`n            Path: $Endpoint"
        "`n            Method: post"
      })
  
"@

# Inserir a nova função no template
$templateContent = $templateContent -replace "(Resources:\s*)", "`$1$newFunctionYaml"

# Salvar o template modificado de volta ao arquivo
$templateContent | Set-Content -Path $TemplateFile

Write-Host "A nova função Lambda '$FunctionName' foi adicionada ao template e o arquivo foi salvo."