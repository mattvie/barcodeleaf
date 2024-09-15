import React, { useState, useEffect, useRef } from 'react';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { BrowserMultiFormatReader } from '@zxing/browser';

import VideoSkeleton from './VideoSkeleton';
import './video.css';

const Video = ({ history }) => {
    const [videoInit, setVideoInit] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [barcodeReadings, setBarcodeReadings] = useState([]);
    const [cameras, setCameras] = useState([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
    const [lastDetectedCode, setLastDetectedCode] = useState(null);
    const [hasRedirected, setHasRedirected] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const lastDecodeAttemptRef = useRef(0);

    const checkReadings = () => {
        if (barcodeReadings.length >= 3 && !hasRedirected) {
            const counts = barcodeReadings.reduce((acc, code) => {
                acc[code] = (acc[code] || 0) + 1;
                return acc;
            }, {});

            const mostFrequent = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

            if (counts[mostFrequent] >= 2) {
                setHasRedirected(true);
                window.location.href = `/product/${mostFrequent}`;
            }
        }
    };

        
    useEffect(() => {
        checkReadings();
    }, [barcodeReadings, hasRedirected]);


    const isGetCapabilitiesSupported = (track) => {
        return track && typeof track.getCapabilities === 'function';
    };

    const initializeCamera = async (deviceId) => {
        const hints = new Map();
        const formats = [
            BarcodeFormat.CODE_128,
            BarcodeFormat.EAN_13,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_39,
            BarcodeFormat.ITF,
            BarcodeFormat.QR_CODE
        ];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.ASSUME_GS1, true);

        if (codeReaderRef.current) {
            // await codeReaderRef.current.reset();
        }

        const codeReader = new BrowserMultiFormatReader(hints);
        codeReaderRef.current = codeReader;

        try {
            const constraints = {
                video: {
                    facingMode: isFrontCamera ? "user" : "environment"
                }
            };
    
            console.log('Attempting to get stream with constraints:', constraints);
    
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
    
            await codeReader.decodeFromStream(stream, videoRef.current, (result, err) => {
                const now = Date.now();
                if (now - lastDecodeAttemptRef.current < 200) {
                    return; // Limita a frequência de decodificação
                }
                lastDecodeAttemptRef.current = now;

                if (result) {
                    const text = result.getText();
                    console.log('Detected barcode:', text);
                    setLastDetectedCode(text);
                    setBarcodeReadings(prevReadings => [...prevReadings, text]);
                }
                if (err && !(err instanceof NotFoundException)) {
                    console.error('Decoding error:', err);
                }

                if (result && !hasRedirected) {
                    const text = result.getText();
                    console.log('Detected barcode:', text);
                    setLastDetectedCode(text);
                    setBarcodeReadings(prevReadings => [...prevReadings, text]);
                }
            });

            setVideoInit(true);
            console.log('Video initialized successfully');
        } catch (err) {
            console.error('Failed to start code reader', err);
            setVideoError(true);
        }
    };

    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
                setCameras(videoInputDevices);
                if (videoInputDevices.length > 0) {
                    await initializeCamera(videoInputDevices[0].deviceId);
                }
            } catch (err) {
                console.error('Failed to list video devices', err);
                setVideoError(true);
            }
        };

        getDevices();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [isFrontCamera]);

    const switchCamera = async () => {
        console.log('Switching camera');
        setIsFrontCamera(!isFrontCamera);
        
        // Pare o stream atual
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // Inicialize a nova câmera
        await initializeCamera();
    };


    return (
        <div className="video__container">
            {videoError ? (
                <div className="skeleton__unsopported">
                    <div>
                        <p>Your device does not support camera access or something went wrong <span role="img" aria-label="thinking-face">🤔</span></p>
                    </div>
                </div>
            ) : (
                <>
                    <video ref={videoRef} id="video" style={{ width: '100vw', height: '100vh' }} autoPlay playsInline />
                    {lastDetectedCode && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '5px'
                        }}>
                            Last detected: {lastDetectedCode}
                        </div>
                    )}
                    {cameras.length > 1 && (
                        <button
                            onClick={switchCamera} 
                            style={{
                                position: 'absolute',
                                bottom: '18vh',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Switch Camera
                        </button>
                    )}
                </>
            )}
            {!videoInit && !videoError && <VideoSkeleton />}
        </div>
    );
}

export default Video;
