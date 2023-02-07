// React imports
import React, { useState } from 'react';

// Screens
import GasPriceScreenCA from './GasPriceScreen/GasPriceScreenCA';
import GasPriceScreenUSA from './GasPriceScreen/GasPriceScreenUSA';

export default function GasPriceScreen() {
  const [selectedValue, setSelectedValue] = useState('Canada');

  return (
    selectedValue === 'Canada'
      ? <GasPriceScreenCA changeCountry={() => setSelectedValue('USA')} />
      : <GasPriceScreenUSA changeCountry={() => setSelectedValue('Canada')} />
  );
}
