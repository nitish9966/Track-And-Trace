import React from 'react';
import { QrReader } from 'react-qr-reader';

const QrScanner = ({ passData }) => {
  return (
    <QrReader
      onResult={(result, error) => {
        if (result) {
          passData(result.text); // Pass data directly instead of using useState
        }
      }}
      style={{ width: '100%' }}
    />
  );
};

export default QrScanner;
