import { useParams } from 'react-router'
import errorImage from './error.png'
import '../product/product.css'

const ProductNotFound = () => {
    const { barcode } = useParams()

    const goBack = () => {
        window.location.href = "/"
    }

    return (
        <div className="global">
            <div className="product__header">
                <div className="product__header__message">Um Erro Ocorreu!</div>
            </div>

            <div className="img_holder">
                <img className="img_product" src={errorImage} alt="logo" />

                <span>
                    Produto Não Encontrado
                </span>
            </div>

            <div className="content_holder">
                <span>O produto de código {barcode} não foi encontrado na nossa base de dados</span>
                <a href="/">Voltar</a>
            </div>
        </div >

    )
}

export default ProductNotFound;