import React, { useState } from 'react';
import './App.css';

import { withAuthenticator } from '@aws-amplify/ui-react';
import DataVisualization from './Graphs';
import { Amplify } from 'aws-amplify';
import amplifyconfig from './amplifyconfiguration.json';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; // Import BrowserRouter and Switch
import { Tabs, Tab } from '@mui/material';
import LambdaDataDisplay from './EV';
import DataVisualization2 from './Graphs2';
Amplify.configure(amplifyconfig, {
  Storage: {
    S3: {
      prefixResolver: async ({ accessLevel, targetIdentityId }) => {
        return ``;
      },
    },
  },
});


function App() {

  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  
  return (
    
    <div className="App">
      <Router>
        {/* Render Route components based on React Router */}
        <Routes >
          {/* <Route path="/" element={<DataVisualization />} /> */}
          <Route path="/" element={<DataVisualization2 />} />
          <Route path="/ev" element={<LambdaDataDisplay />} />
          {/* <Route path="/s3" element={<S3FileViewer />} /> */}
          {/* Add more routes for other components/pages */}
        </Routes >
      </Router>
    </div>
  );
}

export default withAuthenticator(App);
