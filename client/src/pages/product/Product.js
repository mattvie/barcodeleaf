import { useParams } from "react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import './product.css';
import {Accordion, AccordionSummary, AccordionDetails, Typography, ListSubheader} from "@mui/material"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


// static
import searchicon from './whitesearchicon.png'
import cameraicon from './cameraicon.png'
import compareicon from './compareicon.png'

const Product = () => {
    const { barcode } = useParams();
    const [productInfo, setProductInfo] = useState(null);

    const saveToLocalStorage = (barcode, data) => {
        localStorage.setItem("product_" + barcode, JSON.stringify(data));
    };

    const getFromLocalStorage = (barcode) => {
        const savedData = localStorage.getItem("product_" + barcode);
        return savedData ? JSON.parse(savedData) : null;
    };

    const onInfoFetched = (barcode, result) => {
        setProductInfo(result);
        saveToLocalStorage(barcode, result);
        console.log(result); // Logue o resultado diretamente
    };


    useEffect(() => {
        const savedData = getFromLocalStorage();
        if (savedData && savedData.barcode === barcode) {
            setProductInfo(savedData);
        } else {
            const fetchData = async () => {
                try {
                    const response = await axios.get(
                        `https://ak95csc580.execute-api.us-east-1.amazonaws.com/prod/product/${barcode}`,
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                    onInfoFetched(barcode, response.data);
                } catch (error) {
                    console.error('There has been a problem with your axios operation:', error);
                }
            };

            fetchData();
        }
    }, [barcode]);

    const goCamera = () => {
        window.location.href = "/scanner";
    };

    const goCompare = () => {
        window.location.href = "/compare";
    };

    const goSearch = () => {
        window.location.href = "/search";
    };
    console.log("productInfo:", productInfo)

    return (
        <>
            <div className="product__header">
                <div className="product__header__message">Informação do Produto</div>
            </div>

            <div className="content_holder">
                {productInfo ? (
                    <>
                        <div className="img_holder">
                            <img className="img_product" src={productInfo.image_url} alt="logo" style={{borderRadius:'10px'}}/>
                            <span>{productInfo.product_name}</span>
                            <span>{barcode}</span>
                        </div>
                        <span className="rowStyle" style={{width: "80%", marginBottom: "10px"}}>
                            <span>Nível de processamento:</span>
                            <span>{"nova_group" in productInfo ? parseInt(productInfo["nova_group"]):'-'}</span>
                        </span>
                        <span className="rowStyle" style={{width: "80%", marginBottom: "10px"}}>
                            <span>Pontuação ecológica:</span>
                            <span>{"ecoscore_score" in productInfo ? `${productInfo["ecoscore_score"]}`:'-'}</span>
                        </span>
                        <Accordion style={{width: "90%"}}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Substâncias Benéficas</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            
                            <span className="rowStyle">
                                <span>Vitamina B1:</span>
                                <span>{"vitamin-b1" in productInfo ? `${productInfo["vitamin-b1"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Vitamina B2:</span>
                                <span>{"vitamin-b12" in productInfo ? `${productInfo["vitamin-b12"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Vitamina B6:</span>
                                <span>{"vitamin-b6" in productInfo ? `${productInfo["vitamin-b6"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Fibras:</span>
                                <span>{"fiber" in productInfo ? `${productInfo["fiber"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Ferro:</span>
                                <span>{"iron" in productInfo ? `${productInfo["iron"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Proteínas:</span>
                                <span>{"proteins" in productInfo ? `${productInfo["proteins"]}%`:'-'}</span>
                            </span>
                        </AccordionDetails>
                        </Accordion>

                        <Accordion style={{width: "90%"}}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Substâncias Maléficas</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <span className="rowStyle">
                                <span>Carboidratos:</span>
                                <span>{"carbohydrates" in productInfo ? `${productInfo["carbohydrates"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Gordura:</span>
                                <span>{"fat" in productInfo ? `${productInfo["fat"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Gordura Saturada:</span>
                                <span>{"saturated-fat" in productInfo ? `${productInfo["saturated-fat"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Açúcar:</span>
                                <span>{"sugars" in productInfo ? `${productInfo["sugars"]}%`:'-'}</span>
                            </span>
                            <span className="rowStyle">
                                <span>Sal:</span>
                                <span>{"salt" in productInfo ? `${productInfo["salt"]}%`:'-'}</span>
                            </span>
                        </AccordionDetails>
                        </Accordion>

                        <Accordion style={{width: "90%"}}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Alergênicos</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <span>{"allergens" in productInfo ? `Atenção, contém:  ${productInfo["allergens"]}`:''}</span>
                        </AccordionDetails>
                        </Accordion>
                    </>
                ) : (
                    <span>Carregando informações...</span>
                )}
            </div >

            <div className="product__footer">
                <img
                    className="arrows selected"
                    src={searchicon}
                    alt="search"
                    onClick={goSearch}
                />

                <img
                    className="arrows"
                    src={cameraicon}
                    alt="camera"
                    onClick={goCamera}
                />

                <img
                    className="arrows"
                    src={compareicon}
                    alt="compare"
                    onClick={goCompare}
                />

            </div>
        </>
    );
};

export default Product;
