import React, { useState, useEffect } from 'react';
import './searchProducts.css';
import arrowBack from './arrowback.png';
import axios from 'axios';

import searchicon from './whitesearchicon.png'
import cameraicon from './cameraicon.png'
import compareicon from './compareicon.png'

const SearchProducts = () => {
    const [storedProducts, setStoredProducts] = useState([]);
    const [matchedProducts, setMatchedProducts] = useState([]);
    const [compareList, setCompareList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const keys = Object.keys(localStorage);
        const products = []
        keys.forEach(key => {
            if (key.startsWith("product_")) {
                try {
                    let item = JSON.parse(localStorage.getItem(key));
                    products.push(item)
                } catch { }
            }
        });
        setStoredProducts(products);
    }, []);

    const saveToLocalStorage = (barcode, data) => {
        localStorage.setItem("product_" + barcode, JSON.stringify(data));
    };

    const goBack = () => {
        window.location.href = "/";
    };

    const handleSearch = async () => {
        console.log("Buscando por:", searchTerm);
        try {
            setLoading(true)
            const response = await axios.get(`https://ak95csc580.execute-api.us-east-1.amazonaws.com/prod/search/?search=${searchTerm}`);
            console.log(response.data);
            setMatchedProducts(response.data);
            setLoading(false)
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
            throw error; // Re-throw the error if you want to handle it in the calling function
        }
    };

    const goCamera = () => {
        window.location.href = "/scanner";
    };

    const goCompare = () => {
        window.location.href = "/compare";
    };

    const goSearch = () => {
        window.location.href = "/search";
    };

    return (
        <>
            <div className="product__header">
                <div className="product__header__message">Busca</div>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Digite o nome do produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="search-button" onClick={handleSearch}>
                    Buscar
                </button>
            </div>

            {loading && (
                <div className="dot-div">
                    <div className="dot-falling"></div>
                </div>
            )}

            {!loading && (
                <div className="compare-products-search">
                    <div className="products-list-search">
                        {matchedProducts.map((product, index) => (
                            <div key={index} className="product-card">
                                <img className='product-image' src={product.image_url} alt={product.product_name} />
                                <div className='product-info'>
                                    <h4 className='product-name'>
                                        {product.product_name.length > 30 ? `${product.product_name.slice(0, 30)}...` : product.product_name.toUpperCase()}
                                    </h4>
                                </div>
                                <button className="add-button-search" onClick={() => saveToLocalStorage(product.PK, product)}>+</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

export default SearchProducts;
