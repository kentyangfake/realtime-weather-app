import styled from '@emotion/styled';
import WeatherIcon from './components/WeatherIcon';
import { getMoment } from './utils/helper';

// ThemeProvider 跟 useState
import { ThemeProvider } from '@emotion/react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// 載入圖示
import { ReactComponent as AirFlowIcon } from './images/airFlow.svg';
import { ReactComponent as RainIcon } from './images/rain.svg';
import { ReactComponent as RefreshIcon } from './images/refresh.svg';
import { ReactComponent as LoadingIcon } from './images/loading.svg';

//跨瀏覽器處理工具(時間格式)
import dayjs from 'dayjs';

const theme = {
  light: {
    backgroundColor: '#ededed',
    foregroundColor: '#f9f9f9',
    boxShadow: '0 1px 3px 0 #999999',
    titleColor: '#212121',
    temperatureColor: '#757575',
    textColor: '#828282',
  },
  dark: {
    backgroundColor: '#1F2022',
    foregroundColor: '#121416',
    boxShadow:
      '0 1px 4px 0 rgba(12, 12, 13, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.15)',
    titleColor: '#f9f9fa',
    temperatureColor: '#dddddd',
    textColor: '#cccccc',
  },
};

const Container = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui;
`;

const WeatherCard = styled.div`
  position: relative;
  min-width: 360px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  background-color: ${({ theme }) => theme.foregroundColor};
  box-sizing: border-box;
  padding: 30px 15px;
`;

const Location = styled.div`
  font-size: 28px;
  color: ${({ theme }) => theme.titleColor};
  margin-bottom: 20px;
`;

const Description = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.textColor};
  margin-bottom: 30px;
`;

const CurrentWeather = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Temperature = styled.div`
  color: ${({ theme }) => theme.temperatureColor};
  font-size: 96px;
  font-weight: 300;
  display: flex;
`;

const Celsius = styled.div`
  font-weight: normal;
  font-size: 42px;
`;

const AirFlow = styled.div`
  display: flex;
  align-items: center;
  font-size: 16x;
  font-weight: 300;
  color: ${({ theme }) => theme.textColor};
  margin-bottom: 20px;
  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const Rain = styled.div`
  display: flex;
  align-items: center;
  font-size: 16x;
  font-weight: 300;
  color: ${({ theme }) => theme.textColor};
  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const Refresh = styled.div`
  position: absolute;
  right: 15px;
  bottom: 15px;
  font-size: 12px;
  display: inline-flex;
  align-items: flex-end;
  color: ${({ theme }) => theme.textColor};
  svg {
    margin-left: 10px;
    width: 15px;
    height: 15px;
    cursor: pointer;
    /* 使用 rotate 動畫效果 */
    animation: rotate infinite 1.5s linear;
    animation-duration: ${({ isLoading }) => (isLoading ? '1.5s' : '0s')};
  }
  @keyframes rotate {
    from {
      transform: rotate(360deg);
    }
    to {
      transform: rotate(0deg);
    }
  }
`;

//api
const AUTHORIZATION_KEY = 'CWB-F3A8D989-A19B-43F5-8FF5-09EC5C6B8FF7';
const LOCATION_NAME = '彰師大'; // STEP 1：定義 LOCATION_NAME
const LOCATION_NAME_FORECAST = '彰化縣';

// STEP 2：將 AUTHORIZATION_KEY 和 LOCATION_NAME 帶入 API 請求中
const fetchCurrentWeather = () => {

  return fetch(
      `https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${AUTHORIZATION_KEY}&locationName=${LOCATION_NAME}`
    )
    .then((response) => response.json())
    .then((data) => {
      const locationData = data.records.location[0]; // STEP 1：取出資料
      const weatherElements = locationData.weatherElement.reduce((neededElements, item) => {
        if (['WDSD', 'TEMP'].includes(item.elementName)) {
          neededElements[item.elementName] = item.elementValue;
        }
        return neededElements;
      },
      {}
    ); // STEP 2：過濾資料   

    // STEP 3：更新 React 資料狀態
    return {
      station: locationData.locationName,
      observationTime: locationData.time.obsTime,
      temperature: weatherElements.TEMP,
      windSpeed: weatherElements.WDSD,
      isLoading: false, // 資料拉取完後，把 isLoading 設為 false
      };
    });
  };

const fetchWeatherForecast = () => {
      
  return fetch(
      `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${AUTHORIZATION_KEY}&locationName=${LOCATION_NAME_FORECAST}`
    )
    .then((response) => response.json())
    .then((data) => {
      const locationData = data.records.location[0];
      const weatherElements = locationData.weatherElement.reduce((neededElements, item) => {
        if (['Wx', 'PoP', 'CI'].includes(item.elementName)) {
          neededElements[item.elementName] = item.time[0].parameter;
        }
        return neededElements;
      },
      {}
    );

    return {
      locationName: locationData.locationName,
      description: weatherElements.Wx.parameterName,
      weatherCode: weatherElements.Wx.parameterValue,
      rainPossibility: weatherElements.PoP.parameterName,
      comfortability: weatherElements.CI.parameterName,
    };
  });
};

const App = () => {
  console.log('invoke function component'); // 元件一開始加入 console.log
  const [currentTheme, setCurrentTheme] = useState('light');
  
  // 定義會使用到的資料狀態
  const [weatherElement, setWeatherElement] = useState({
    observationTime: new Date(),
    locationName: '',
    description: '',
    temperature: 0,
    windSpeed: 0,
    weatherCode: 0,
    rainPossibility: 0,
    comfortability: '',
    station: '',
    isLoading: true,
  });

  const moment = useMemo(() => getMoment(LOCATION_NAME_FORECAST), []);
  
  useEffect(() => {
    setCurrentTheme(moment === 'day' ? 'light' : 'dark');
  }, [moment]);

  const fetchData = useCallback(async () => {
    // 在開始拉取資料前，先把 isLoading 的狀態改成 true
    setWeatherElement((prevState) => ({
      ...prevState,
      isLoading: true,
    }));

    // STEP 2：使用 Promise.all 搭配 await 等待兩個 API 都取得回應後才繼續
    // 直接透過陣列的解構賦值來取出 Promise.all 回傳的資料
    const [currentWeather, weatherForecast] = await Promise.all([
      fetchCurrentWeather(),
      fetchWeatherForecast(),
    ]);
    // 把取得的資料透過物件的解構賦值放入
    setWeatherElement({
      ...currentWeather,
      ...weatherForecast,
      isLoading: false,
    });
  }, []);

  // 加入 useEffect 方法，畫面render完即更新
  useEffect(() => {
    console.log('execute function in useEffect');
    // STEP 4：再 useEffect 中呼叫 fetchData 方法
    fetchData();
  }, [fetchData]);
  

  //用解構賦值讓版面更乾淨
  const {
    observationTime,
    locationName,
    description,
    windSpeed,
    temperature,
    rainPossibility,
    comfortability,
    station,
    isLoading,
    weatherCode,
  } = weatherElement;

  return(
    <ThemeProvider theme={theme[currentTheme]}>
    <Container>
      {console.log('render, isLoading: ', isLoading)}
      <WeatherCard>
        <Location>{locationName}</Location>
        <Description>{description}{comfortability}</Description>
        <CurrentWeather>
          <Temperature>
          {Math.round(temperature)} <Celsius>°C</Celsius>
          </Temperature>
          <WeatherIcon weatherCode={weatherCode} moment={moment} />
        </CurrentWeather>
        <AirFlow><AirFlowIcon /> {windSpeed} m/h </AirFlow>
        <Rain><RainIcon /> {rainPossibility}% </Rain>
        <Refresh onClick={fetchData} isLoading={isLoading}>
          {station}站最後觀測時間：{new Intl.DateTimeFormat('zh-TW', {hour: 'numeric', minute: 'numeric',}).format(dayjs(observationTime))}
          {isLoading ? <LoadingIcon /> : <RefreshIcon />}
        </Refresh>
      </WeatherCard>
    </Container>
    </ThemeProvider>
  );
}

export default App;