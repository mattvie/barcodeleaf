import { useState, useEffect, lazy, Suspense } from 'react'
//import { BounceLoader } from "react-spinners";

import DataHandler from './DataHandler'
//import BarcodeInputField from './barcode/BarcodeInputField'

import './scanner.css'
import logo from './logo2.png'
import barcodelogo from './barcodelogo.png'
import titlelogo from './titlelogo.png'

const Video = lazy(() => import('./video/Video'))
const CameraHandler = () => {

    const [loading, setLoading] = useState(false)
    const [isCameraSupported, setCameraSupported] = useState(false);
    const [isCameraEnabled, setCameraEnabled] = useState(DataHandler.isCameraPermissionGranted());

    useEffect(() => {
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
        }, 3000)
    }, [])

    useEffect(() => {
        setTimeout(() => { }, 3000)
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            setCameraSupported(true);
        }
    }, [])

    const onCamEnabled = () => {
        DataHandler.cameraPermissionGranted();
        setCameraEnabled(true);
    }

    return (
        <div>

            {loading ?
                <div className="loading">
                    <img className="img_logo" src={logo} alt="logo" />
                    <img className="img_logo title" src={titlelogo} alt="title logo" />
                    <img className="img_logo bcode" src={barcodelogo} alt="barcode logo" />
                </div>

                :
                ""
            }

            {!loading && isCameraSupported && isCameraEnabled ?

                <>
                    <div className="product__header">
                        <div className="product__header__message">Leitor de Código de Barras</div>
                    </div>

                    <Suspense fallback={<div></div>}>
                        <Video />
                    </Suspense>
                </>
                :
                ""
            }
            {!loading && isCameraSupported && !isCameraEnabled ?
                <>
                    <div className="cameraHandler__message">Ative sua câmera para escanear produtos
                        <br />
                        <div className="cameraHandler__messageIcon"></div>
                    </div>
                    <div className="button__styling">
                        <button type="button" aria-label="Enable Camera" className="camera__enable" onClick={onCamEnabled} >
                            Câmera
                        </button>
                    </div>
                </>
                :
                ""
            }
            {!loading && !isCameraSupported ?
                <div className="cameraHandler__unsopported">
                    Camera Not Supported
                </div>
                :
                ""
            }
        </div>
    );
}

export default CameraHandler;