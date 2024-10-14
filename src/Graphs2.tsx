/* eslint-disable no-loop-func */
import React, { useEffect, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { Container, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import { downloadData } from "@aws-amplify/storage"
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import LineChart from './FinancialChart';
import MemoizedLineChart from './FinancialCharts2';


export interface aaa {
  "Test": string;
}
export interface Data {
  "Timestamp":Date, 
  "Sport":string,
  "Category":string, 
  "Matchup":string, 
  "Participant":string, 
  "Type":string, 
  "Title":string, 
  "Line":number, 
  "Over Odds"?:number, 
  "Under Odds"?:number, 
  "Source": string;
}

const DataVisualization2: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [data, setData] = useState<Data[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedBet, setSelectedBet] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMatchup, setSelectedMatchup] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');

  const handleDateChange = (date: React.SetStateAction<dayjs.Dayjs | null>) => {
    setSelectedDate(date);
    const sports = getSports();
    sports.length === 1 ? setSelectedSport(sports[0]) : setSelectedSport('');
  };
  const handleSportChange = (event: SelectChangeEvent) => {
    setSelectedSport(event.target.value as string);
  };
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value  as string);
  };
  const handleMatchupChange = (event: SelectChangeEvent) => {
    setSelectedMatchup(event.target.value  as string);
  };
  const handleParticipantChange = (event: SelectChangeEvent) => {
    setSelectedParticipant(event.target.value  as string);
  };
  const handleBetChange = (event: SelectChangeEvent) => {
    setSelectedBet(event.target.value  as string);
  };
  
  function getSports() {
    return Array.from(new Set(data.map((a)=>a.Sport)));
  }
  
  function getMatchups() {
    return Array.from(
      new Set(data.filter((a)=>a.Source === "Pinnacle" )
      .filter((a)=>selectedSport === "" || a.Sport===selectedSport)
      .map((a)=>a.Matchup))
    ).sort();
  }

  function getCategories() {
    return Array.from(
      new Set(data.filter((a)=>a.Source === "Pinnacle" )
      .filter((a)=>selectedSport === "" || a.Sport===selectedSport)
       .filter((a)=>a.Matchup === "" || a.Matchup===selectedMatchup)
       .map((a)=>a.Category))
    ).sort();
  }


  function getParticipants() {
    return Array.from(
      new Set(data.filter((a)=>a.Source === "Pinnacle" )
      .filter((a)=>selectedSport === "" || a.Sport===selectedSport)
      .filter((a)=>selectedMatchup === "" || a.Matchup===selectedMatchup)
      .filter((a)=>selectedCategory === "" || a.Category===selectedCategory)
      .map((a)=>a.Participant))
    ).sort();
  }

  function getLabels() {
    return Array.from(
      new Set(data.filter((a)=>a.Source === "Pinnacle" )
      .filter((a)=>selectedSport === "" || a.Sport===selectedSport)
       .filter((a)=>selectedCategory === "" || a.Category===selectedCategory)
       .filter((a)=>selectedMatchup === "" || a.Matchup===selectedMatchup)
       .filter((a)=>selectedParticipant === "" || a.Participant===selectedParticipant)
       .map((a)=>a.Type))
    ).sort();
  }

  function getSelectedBet(){
    return Array.from(
      new Set(data.filter((a)=>a.Sport===selectedSport && 
      a.Category===selectedCategory && 
      a.Matchup===selectedMatchup &&
      a.Participant===selectedParticipant &&
      a.Type === selectedBet))
    );
  }
  function getSelectedBetTitle() {
    const selected = getSelectedBet()[0];
    if (selected) {
      return selected.Title;
    }
  }
  function getSelectedBetInfo() {
    if (getSelectedBet().length > 0) {
      const selected = getSelectedBet().slice(-1)[0];
      let output = '';
      if (selected.Line) {
        output += `Line: ${selected.Line}`;
      }
      if (selected['Over Odds']) {
        if (output.length > 0) {
          output += ', ';
        }
        output += `Over Odds: ${selected['Over Odds']}`;
      }
      if (selected['Under Odds']) {
        if (output.length > 0) {
          output += ', ';
        }
        output += `Under Odds: ${selected['Under Odds']}`;
      }
      return output;
    }
  }

  function filterData() {
      const selectedBetTitle = getSelectedBetTitle();
      const aaa= data.filter(d =>selectedBetTitle && d.Title === selectedBetTitle);
      const sortByTimestamp = aaa.slice().sort((a, b) => a.Timestamp.getTime() - b.Timestamp.getTime());
      console.log(sortByTimestamp);
      return sortByTimestamp;

    // const filteredData = data.filter((d)=>d.Category===selectedCategory && 
    //   d.Sport===selectedSport &&
    //   d.Matchup===selectedMatchup &&
    //   d.Participant===selectedParticipant && 
    //   d.Type===selectedBet);
    // // console.log(filteredData);
    // return filteredData;
  }

  function createMenuItem(item: string){
    return <MenuItem key={item} value={item}>{item}</MenuItem>
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
          const sources = ['PinnacleOddsData', 'FanduelOddsData', 'DraftkingsOddsData', 'EspnOddsData'];
          let combinedData: Data[] = [];
  
          for (const source of sources) {
              const response = await fetch(`https://sportsbook-odds.s3.us-east-1.amazonaws.com/${selectedDate?.format('YYYY/MM/DD')}/${source}.csv`);
  
              if (!response.ok) {
                  throw new Error(`Failed to fetch data for ${source}. Status: ${response.status}`);
              }
  
              const csvData = await response.text();
              const parsedResult = Papa.parse(csvData, {
                  header: true,
                  dynamicTyping: true,
                  skipEmptyLines: true
              });
  
              if (parsedResult.errors.length > 0) {
                  console.error('Error parsing CSV for', source, ':', parsedResult.errors);
              }
  
              const parsedData = parsedResult.data.map((d: any) => ({
                  ...d,
                  Timestamp: new Date(d.Timestamp),
                  Source: source.replace('OddsData', '')
              }));
  
              combinedData = [...combinedData, ...parsedData];
  
              if (source === "PinnacleOddsData") {
                  setHeaders(parsedResult.meta.fields || []);
              }
          }
  
          setData(combinedData);
      } catch (error) {
          console.error('Error fetching data:', error);
      }
  };
  
    fetchData();
  }, [selectedDate]);

  const renderSelect = (label: string, value: string, onChange: (event: SelectChangeEvent) => void, items: string[]) => (
    <Grid item>
      <InputLabel id={`select-${value}-label`}>{label}</InputLabel>
      <Select
        id={`${value}Dropdown`}
        value={value}
        onChange={onChange}
        label={label}
        labelId={`select-${value}-label`}
      >
        {items.map((item) => createMenuItem(item))}
      </Select>
    </Grid>
  );

  function getColor(source: string) {
    const colors: Record<string, string> = {
      'Pinnacle': '#8884d8',
      'Fanduel': '#82ca9d',
      'Draftkings': '#ffc658',
      'Espn': '#ff00ff' // Example color, you can change it
    };
    return colors[source];
  }
  // function renderLines(dataKeyName: string): JSX.Element[] {
  //   return ['Pinnacle', 'Fanduel', 'Draftkings', 'Espn'].map((source, index) => {
  //     const filteredData = filterData().filter(d => d.Source === source);
  //     if (filteredData.length > 0) {
  //       return (
  //         <Line
  //           key={index}
  //           type="linear"
  //           dataKey={dataKeyName}
  //           stroke={getColor(source)}
  //           name={source}
  //           data={filteredData}
  //         />
  //       );
  //     }
  //     return <></>;
  //   });
  // }

  function getXXX(){

    return <>
      {data.length===0 && <div>Samm</div>}
      <Grid container direction="row" spacing={2} xs={12} md={3} justifyContent="center" alignItems="center">
        <Grid item>
         <InputLabel id="demo-simple-select-label">Select date</InputLabel >
          <FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={handleDateChange}
                />
            </LocalizationProvider>
          </FormControl>
        </Grid>
        {data.length>0 && <> 
          {renderSelect('Select a sport', selectedSport, handleSportChange, getSports())}
          {renderSelect('Select a matchup', selectedMatchup, handleMatchupChange, getMatchups())}
          {renderSelect('Select a bet category', selectedCategory, handleCategoryChange, getCategories())}
          {renderSelect('Select a bet participant', selectedParticipant, handleParticipantChange, getParticipants())}
          {renderSelect('Select a bet', selectedBet, handleBetChange, getLabels())} 
        </>}
      </Grid>
        {data.length>0 && <> 
        <Grid container direction="row" spacing={2} xs={12} md={9} alignItems="center" style={{width:"100%", height:"100%"}}>

        <Grid xs={12} md={12} direction="row" justifyContent="center" alignItems="center">
            <Typography variant='h3' align="center">{getSelectedBetTitle()}</Typography>
            <Typography variant='h5' align="center">{getSelectedBetInfo()}</Typography>
        </Grid>
        <Grid container item spacing={2} xs={12}  direction="row" style={{width:"100%", height:"100%"}}>
          <Grid item xs={12} md={4} style={{ minHeight: '50vh' }} >
            {/* <LineChart data={filterData()} width={800} height={400} ratio={3} /> */}
            <MemoizedLineChart
                data={filterData()}
                width={800} // Adjust the width as needed
                height={400} // Adjust the height as needed
                ratio={2} // This is typically the device pixel ratio, 2 is a common default
            />
          </Grid>
      </Grid>
      </Grid>
      </>}
    </>
  }

  // function getDate(date: string | Date) {
  //   // Parse the date if it's a string
  //   if (typeof date === 'string') {
  //     return dayjs(date).toDate(); // Assuming you're using dayjs for date manipulation
  //   }
  //   return date; // Return the date if it's already a Date object
  // }


  return (
    <div style={{width:"100%", height:"100%"}}>
      <Container >
          <Grid container 
                justifyContent="center"
                alignItems="center"
                style={{ minHeight: '100vh' }}>
          {getXXX()}
        </Grid>
      </Container>
    </div>
  );
};


export default DataVisualization2;
