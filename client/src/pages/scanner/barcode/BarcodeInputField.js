import React, { useState } from "react";

const BarcodeInputField = (props) => {
    const [enteredProduct, setEnteredProduct] = useState(null);

    const onSubmit = (e) => {
        e.preventDefault();
        console.log(enteredProduct)
        alert(enteredProduct)
    }

    const onInputChange = (e) => {
        setEnteredProduct(e.target.value);
    }

    return (
        <form onSubmit={onSubmit}>
            <input placeholder="e.g. 7622300710613" className="textInput" required type="number" onChange={onInputChange} />
            <button className="btn" type="submit">Find</button>
        </form>
    )
}

export default BarcodeInputField;