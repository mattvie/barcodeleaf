import React, { useState, useEffect } from 'react';
import './compareProducts.css';
import searchicon from './searchicon.png';
import cameraicon from './cameraicon.png';
import compareicon from './whitecompareicon.png';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CompareProducts = () => {
    const [storedProducts, setStoredProducts] = useState([]);
    const [compareList, setCompareList] = useState([]);

    useEffect(() => {
        const keys = Object.keys(localStorage);
        const products = [];
        keys.forEach(key => {
            if (key.startsWith("product_")) {
                try {
                    let item = JSON.parse(localStorage.getItem(key));
                    products.push(item);
                } catch {}
            }
        });
        setStoredProducts(products);
    }, []);

    const toggleCompare = (product) => {
        setCompareList(prevList => {
            if (prevList.some(p => p === product)) {
                return prevList.filter(p => p !== product);
            } else if (prevList.length < 2) {
                return [...prevList, product];
            }
            return prevList;
        });
    };

    const removeFromCompare = (product) => {
        setCompareList(prevList => prevList.filter(p => p !== product));
    };

    const compareAttribute = (attr) => {
        const winColors = ['darkseagreen', '#D97781']
        const loseColors = ['#D97781', 'darkseagreen']
        const evenColors = ['', '']

        if (attr == "serving_size") return evenColors;
        if (attr in ["allergens"]) return evenColors
        if (compareList.length !== 2) return evenColors;
        
        const [p1, p2] = compareList;
        if (p1[attr] === undefined || p2[attr] === undefined) return evenColors;

        const [val1, val2] = compareList.map(p => parseFloat(p[attr]) || 0);
        console.log(typeof(val1), typeof(val2))
        if (attr in ["proteins", "fiber", "iron", "vitamin-b1", "vitamin-b12", "vitamin-b6, ecoscore_score"])
            return val1 > val2 ? winColors : val1 < val2? loseColors:evenColors;
        else 
            return val1 < val2 ? winColors : val1 > val2? loseColors:evenColors;
    };

    const renderProductList = () => (
        <div className="products-grid">
            {storedProducts.map((product, index) => (
                <div key={index} className="product-item">
                    <img src={product.image_url} alt={product.product_name} />
                    <span className='product-name'>
                        {product.product_name.toUpperCase().slice(0, 30) + (product.product_name.length > 30 ? '...' : '')}
                    </span>
                    <button 
                        className={compareList.includes(product) ? "remove-button" : "add-button"}
                        onClick={() => toggleCompare(product)}
                    >
                        {compareList.includes(product) ? '-' : '+'}
                    </button>
                </div>
            ))}
        </div>
    );
    
    const renderComparisonRow = (attr, label) => {
        const [color1, color2] = compareAttribute(attr);
        let val1 = compareList[0][attr]
        let val2 = compareList[1][attr]
        if (attr == "nova_group"){
            val1 = parseInt(val1).toFixed(0)
            val2 = parseInt(val2).toFixed(0)
            if (isNaN(val1)) val1 = "-"
            if (isNaN(val2)) val2 = "-"
        }
            
        return (
            <div key={attr} className="attribute-row">
                <span style={{backgroundColor: color1}}>{typeof(val1)=='number'?val1.toFixed(2):val1 || '-'}</span>
                <span className="attribute-label">{label}</span>
                <span style={{backgroundColor: color2}}>{typeof(val2)=='number'?val2.toFixed(2):val2 || '-'}</span>
            </div>
        );
    };

    const renderComparison = () => (
        <div className="comparison-view">
            <div className="product-columns">
                {compareList.map((product, index) => (
                    <div key={index} className="product-column">
                        <img src={product.image_url} alt={product.product_name} />
                        <h3>{product.product_name.toUpperCase()}</h3>
                        <p>{product.barcode}</p>
                        <button className="remove-button" onClick={() => removeFromCompare(product)}>Remover</button>
                    </div>
                ))}
            </div>

            <Accordion style={{ width: "100%" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Informações Gerais</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {renderComparisonRow('nova_group', 'Nível de processamento')}
                    {renderComparisonRow('ecoscore_score', 'Pontuação ecológica')}
                </AccordionDetails>
            </Accordion>

            <Accordion style={{ width: "100%" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Substâncias Benéficas</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {renderComparisonRow('vitamin-b1', 'Vitamina B1')}
                    {renderComparisonRow('vitamin-b12', 'Vitamina B2')}
                    {renderComparisonRow('vitamin-b6', 'Vitamina B6')}
                    {renderComparisonRow('fiber', 'Fibras')}
                    {renderComparisonRow('iron', 'Ferro')}
                    {renderComparisonRow('proteins', 'Proteínas')}
                </AccordionDetails>
            </Accordion>
            <Accordion style={{ width: "100%" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Substâncias Maléficas</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {renderComparisonRow('carbohydrates', 'Carboidratos')}
                    {renderComparisonRow('fat', 'Gordura')}
                    {renderComparisonRow('saturated-fat', 'Gordura Saturada')}
                    {renderComparisonRow('sugars', 'Açúcar')}
                    {renderComparisonRow('salt', 'Sal')}
                </AccordionDetails>
            </Accordion>
            <Accordion style={{ width: "100%" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Alergênicos</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {renderComparisonRow('allergens', 'Alergênicos')}
                </AccordionDetails>
            </Accordion>
        </div>
    );


    return (
        <div className="compare-products">
            <div className="product__header">
                <div className="product__header__message">Produtos Armazenados</div>
            </div>

            <main>
                {compareList.length === 2 ? renderComparison() : renderProductList()}
            </main>

            <div className="product__footer">
                <img className="arrows" src={searchicon} alt="search" onClick={() => window.location.href = "/search"} />
                <img className="arrows" src={cameraicon} alt="scanner" onClick={() => window.location.href = "/scanner"} />
                <img className="arrows selected" src={compareicon} alt="compare" onClick={() => window.location.href = "/compare"} />
            </div>
        </div>
    );
};

export default CompareProducts;
