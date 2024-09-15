import './App.css';

import { Routes, Route } from 'react-router-dom';

import Layout from './pages/layout/Layout'
import Scanner from './pages/scanner/Scanner'
import Product from './pages/product/Product'
import ProductNotFound from './pages/productNotFound/ProductNotFound'
import CompareProducts from './pages/compareProdutos/compareProducts'
import SearchProducts from './pages/searchProduct/searchProducts';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>

        <Route index element={<SearchProducts />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/search" element={<SearchProducts />} />
        <Route path="/compare" element={<CompareProducts />} />
        <Route path="/product/:barcode" element={<Product />} />
        <Route path="/product/:barcode/not-found" element={<ProductNotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
