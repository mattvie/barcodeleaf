# Backend

Algumas instruções de desenvolver nesse ambiente.

## Crie uma função

Existem várias maneiras de fazer isso, 2 são recomendadas.

### 1. Copy/Paste

Se vai desenvolver uma nova função do 0 basta:
  - copiar uma pasta de função na aba functions (recomendo utilizar a hello_world), alterando o nome da função; 
  - copiar o recurso da função no template.yml alterando o nome dela em todas os campos necessários.
  - copiar a referência da api (admin_prod.yaml) caso a função deva possuir rota, alterando o nome dela em todos os campos necessários.

### 2. Scripts

Caso ainda não se sinta seguro pra explorar o código dessa maneira, pode utilizar os scripts:
  - Se for usuário de linux ou unix baixe o powershell
    - Ubuntu
    ```shell
    # Atualizar a lista de pacotes
    sudo apt update

    # Instalar pacotes necessários
    sudo apt install -y wget apt-transport-https software-properties-common

    # Importar a chave pública do repositório da Microsoft
    wget -q https://packages.microsoft.com/keys/microsoft.asc -O- | sudo apt-key add -

    # Registrar o repositório da Microsoft
    sudo add-apt-repository "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-ubuntu-$(lsb_release -rs)-prod $(lsb_release -cs) main"

    # Atualizar a lista de pacotes novamente
    sudo apt update

    # Instalar o PowerShell
    sudo apt install -y Powershellhell
    ```
    - Mac
    ```bash
    # Instalar o Homebrew se ainda não estiver instalado
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Usar o Homebrew para instalar o PowerShell
    brew install --cask powershell
    ```

  - Dado que o Powershell esteja instalado e iniciado, instale agora o pacote de ferramentas Lambda da AWS para powershell
    - Windows
    ```powershell
    Install-Module -Name AWS.Tools.Installer -Scope CurrentUser
    Install-AWSToolsModule AWS.Tools.Lambda -Scope CurrentUser
    Install-AWSToolsModule AWS.Tools.Common -Scope CurrentUser
    ```

  - Caso queira criar uma nova função execute no diretório raiz do backend o arquivo newFunction.ps1 num terminal powershell.
  
    ```powershell
    ./newFunction.ps1 -FunctionName <nome_da_funcao>
    ```
    Isso irá criar uma pasta nova de função com o nome passado no argumento
  - Caso queira também criar um endpoint para a função execute o arquivo de criação de endpoint newRoute.ps1.
    ```powershell
    ./newRoute.ps1 -FunctionName <nome_da_funcao> -Endpoint </caminho/do/endpoint>
    ```
  Isso irá criar um endpoint na especificação da api associado a função.

## Deploy

  Quando o deploy é feito, tudo (funções e api) são sincronizados de modo que se o ambiente estiver configurado corretamente, todas as rotas estarão disponíveis com o código deployado em poucos segundos.

  Para executar o deploy existem o `sam deploy` e o `sam sync`. Uma vez que foi feito o `sam deploy` basta utilizar o `sam sync` que ele monitorará tudo que foi feito porém ainda não deploiado e irá fazer um soft deploy.

  ```powershell
  # Fazer deploy inicial
  sam deploy --guided

  # Fazer deploys constantemente
  sam sync --no-dependency-layer --stack-name projetao
  ```

  A flag --no-dependency-layer é utilizada para diminuir a necessidade de ficar criando uma layer (conjunto de dependências) por função. Invés disso criamos layers compartilhadas e apenas referenciamos elas nas funções. **O processo de criação de layers não possui scripts ainda, devendo ser feito manualmente com cuidado.** Existe um exemplo de layer definida no projeto, chamada requests. Caso queira criar outra layer basta duplicar a pasta a partir da pasta layer/requests/ e duplicar o recurso da layer request no template, substituindo os valores necessários.

## Testes

  Testar uma função utilizando sam é muito simples, porém necessita dos seguintes requisitos:

  * SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
  * [Python 3 installed](https://www.python.org/downloads/)
  * Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

  Dado que os requisitos foram instalados e você já criou sua função, crie um evento de teste (pode duplicar algum da pasta events) e então execute o comando de teste.
  
  ```cli
  sam local invoke <nome_da_funcao> -e events/<nome_do_event>.json
  ``` 

  Isso vai fazer a função ser invocada utilzando a configuração presente no template e o objeto de requisição presente no evento. Há, porém outras formas mais robustas e dinâmicas de testes, como um ambiente lambda local onde uma função pode invocar a outra e vice-versa como se estivessem na nuvem, porém o sam local invoke é mais que suficiente para a massiva maioria dos casos. De qualquer forma há uma documentação de breefing da própria AWS sobre como utilizar o SAM, deixei no arquivo sam.md. Testes remotos também são fáceis de fazer e podem ser feitos tanto via postman ou cliente de requisição nos casos em que há um endpoing associado a função, como podem ser feitos via cli também.

  ```cli
  aws lambda invoke --function-name <nome_da_funcao> --payload file://events/<nome_do_event>.json <armazenador_da_resposta>.json
  ```

  Nessa execução o lambda recebe o conteúdo do evento de invocação, executa a funçao e devolve uma resposta gravando a resposta num json.