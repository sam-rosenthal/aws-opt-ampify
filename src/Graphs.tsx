import React, { useEffect, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { Container, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { downloadData } from "@aws-amplify/storage"
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

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
}
const DataVisualization: React.FC = () => {
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
      new Set(data.filter((a)=>selectedSport === "" || a.Sport===selectedSport)
      .map((a)=>a.Matchup))
    ).sort();
  }

  function getCategories() {
    return Array.from(
      new Set(data.filter((a)=>selectedSport === "" || a.Sport===selectedSport)
       .filter((a)=>a.Matchup === "" || a.Matchup===selectedMatchup)
       .map((a)=>a.Category))
    ).sort();
  }


  function getParticipants() {
    return Array.from(
      new Set(data.filter((a)=>selectedSport === "" || a.Sport===selectedSport)
      .filter((a)=>selectedMatchup === "" || a.Matchup===selectedMatchup)
      .filter((a)=>selectedCategory === "" || a.Category===selectedCategory)
      .map((a)=>a.Participant))
    ).sort();
  }

  function getLabels() {
    return Array.from(
      new Set(data.filter((a)=>selectedSport === "" || a.Sport===selectedSport)
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
    const filteredData = data.filter((d)=>d.Category===selectedCategory && 
      d.Sport===selectedSport &&
      d.Matchup===selectedMatchup &&
      d.Participant===selectedParticipant && 
      d.Type===selectedBet);
    // console.log(filteredData);
    return filteredData;
  }

  function createMenuItem(item: string){
    return <MenuItem key={item} value={item}>{item}</MenuItem>
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
          // Fetch CSV data
          const response = await fetch(`https://sportsbook-odds.s3.us-east-1.amazonaws.com/${selectedDate?.format('YYYY/MM/DD')}/PinnacleOddsData.csv`);
  
          // Check if response is successful
          if (!response.ok) {
              throw new Error(`Failed to fetch data. Status: ${response.status}`);
          }
  
          // Parse CSV data
          const csvData = await response.text();
          console.log(csvData);
  
          Papa.parse(csvData, {
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              complete: (result) => {
                  const parsedData = result.data.map((d: any) => {
                      if (typeof d === 'object' && d !== null) { // Check if d is an object
                          return {
                              ...d,
                              Timestamp: getDate(d.Timestamp),
                          };
                      } else {
                          return d;
                      }
                  });
                  const parsedHeaders = result.meta.fields || [];
                  console.log(parsedData);
                  setData(parsedData);
                  setHeaders(parsedHeaders);
              },
              error: (error: { message: any; }) => {
                  console.error('Error parsing CSV:', error.message);
              },
          });
      } catch (error) {
          console.error('Error fetching data from the URL:', error);
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filterData()}>
                <XAxis dataKey="Timestamp" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Legend />
                <Line type="linear" dataKey="Line" stroke="#8884d8" />
              </LineChart>  
            </ResponsiveContainer>
          </Grid>
          {filterData().some(item => item["Over Odds"] !== null) && <Grid item xs={12} md={4} style={{ minHeight: '50vh' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filterData()}>
              <XAxis dataKey="Timestamp" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="linear" dataKey="Over Odds" stroke="#8884d8" name="Over odds"/>
            </LineChart>
          </ResponsiveContainer>
        </Grid>}
        {filterData().some(item => item["Under Odds"] !== null) && <Grid item xs={12} md={4} style={{ minHeight: '50vh' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filterData()}>
              <XAxis dataKey="Timestamp" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="linear" dataKey="Under Odds" stroke="#8884d8" name="Under odds"/>
            </LineChart>
          </ResponsiveContainer>
        </Grid>}
      </Grid>
      </Grid>
      </>}
    </>
  }

  function getDate(date: string| Date){
    return date;
  }


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


export default DataVisualization;