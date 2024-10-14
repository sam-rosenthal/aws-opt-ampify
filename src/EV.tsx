import React, { useEffect, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';

import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

interface Data {
  "Participant": string;
  "Type": string;
  "Bet": string;
  "Book": string;
  "Odds"?: number;
  "EV"?: number;
  "Kelley"?: number;
  "Bet Amount"?: number;
  "Market Width"?: number;
  "otherBookInfo": string;
  "Sport": string;
  "Category": string;
  "Matchup": string;
  "Timestamp": string;
  [key: string]: number | string | undefined;
}

  const LambdaDataDisplay: React.FC = () => {
    const [data, setData] = useState<Data[]>([]);
    // const [commercialBook, setCommercialBook] = useState<String>('Draftkings');
    const today = new Date();
    var tmp = new Date(today);
    tmp.setDate(today.getDate() + 1);
    const tomorrow = tmp.toLocaleString("en-US", { timeZone: "America/New_York" }).split(',')[0].replace(/(\d+)\/(\d+)\/(\d+)/, (match, p1, p2, p3) => `${p3}/${p1.padStart(2, '0')}/${p2.padStart(2, '0')}`);
    const [date, setDate] = useState<String>(tomorrow);
    // const [date, setDate] = useState<String>(today);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const lambdaEndpoint = 'https://zny4ulk829.execute-api.us-east-1.amazonaws.com/prod/plus-ev'; 
  
          const response = await fetch(lambdaEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({"date": date}),
          });
  
          if (response.ok) {
            const csvData = await response.json();
  
            Papa.parse(csvData, {
              header: true,
              dynamicTyping: true,
              complete: (result: ParseResult<Data>) => {
                setData(result.data);
              },
              error: (error: any) => {
                console.error('Error parsing CSV:', error);
              },
            });
          } else {
            console.error('Failed to fetch data from Lambda:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
  
      fetchData();
    }, [date]);

    useEffect(() => {
      console.log('Updated Data:', data);
      
    }, [data]); // Log data whenever it changes

  console.log(Object.keys(data[0] || {}).map((column) => (column)))

  const hotSettings = {
    data: data,
    columns: Object.keys(data[0] || {}).map((key) => ({ data: key, type: 'text' })),
    colHeaders: Object.keys(data[0] || {}).map((column) => (column)),
    customBorders: true,
    multiColumnSorting: true,
    filters: true, 
    dropdownMenu: true,
    contextMenu: {items:{remove_row:{}}},
    manualColumnResize: true,
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: "non-commercial-and-evaluation",
  };

  return (<>
    <HotTable settings={hotSettings} />
  </>);

};

export default LambdaDataDisplay;
