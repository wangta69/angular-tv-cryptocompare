import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
    widget,
    IChartingLibraryWidget,
    ChartingLibraryWidgetOptions,
    LanguageCode,
    Timezone,
    IBasicDataFeed,
    ResolutionString,
    ResolutionBackValues,
    HistoryDepth
} from '../../assets/charting_library/charting_library.min';

import { TradeHistoryService } from '../services/cryptocompare-tv/trade-history.service';
import { SocketService } from '../services/cryptocompare-tv/socket.service';
const history: any = {};

@Component({
    selector: 'app-tv-chart-container',
    templateUrl: './tv-chart-container.component.html',
    styleUrls: ['./tv-chart-container.component.css']
})
export class TvChartContainerComponent implements OnInit, OnDestroy {
    private _symbol: ChartingLibraryWidgetOptions['symbol'] = 'Coinbase:BTC/USD'; // AAPL
    private _interval: ChartingLibraryWidgetOptions['interval'] = '1'; // D
    // BEWARE: no trailing slash is expected in feed URL
    // private _datafeedUrl = 'https://demo_feed.tradingview.com';
    private _libraryPath: ChartingLibraryWidgetOptions['library_path'] = '/assets/charting_library/';
    private _chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'] = 'https://saveload.tradingview.com';
    private _chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'] = '1.1';
    private _clientId: ChartingLibraryWidgetOptions['client_id'] = 'tradingview.com';
    private _userId: ChartingLibraryWidgetOptions['user_id'] = 'public_user_id';
    private _fullscreen: ChartingLibraryWidgetOptions['fullscreen'] = false;
    private _autosize: ChartingLibraryWidgetOptions['autosize'] = true;
    private _containerId: ChartingLibraryWidgetOptions['container_id'] = 'tv_chart_container';
    private _tvWidget: IChartingLibraryWidget | null = null;

    private Datafeed: IBasicDataFeed;
    private timezone: Timezone = 'Etc/UTC';
    private supportedResolutions: string[] = ['1', '3', '5', '15', '30', '60', '120', '240', '720'];
    private historyDepthReturn: HistoryDepth;
    private config = {
        supported_resolutions: this.supportedResolutions
    };

    @Input()
    set symbol(symbol: ChartingLibraryWidgetOptions['symbol']) {
        this._symbol = symbol || this._symbol;
    }

    @Input()
    set interval(interval: ChartingLibraryWidgetOptions['interval']) {
        this._interval = interval || this._interval;
    }

//    @Input()
//    set datafeedUrl(datafeedUrl: string) {
//        this._datafeedUrl = datafeedUrl || this._datafeedUrl;
//    }

    @Input()
    set libraryPath(libraryPath: ChartingLibraryWidgetOptions['library_path']) {
        this._libraryPath = libraryPath || this._libraryPath;
    }

    @Input()
    set chartsStorageUrl(chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url']) {
        this._chartsStorageUrl = chartsStorageUrl || this._chartsStorageUrl;
    }

    @Input()
    set chartsStorageApiVersion(chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version']) {
        this._chartsStorageApiVersion = chartsStorageApiVersion || this._chartsStorageApiVersion;
    }

    @Input()
    set clientId(clientId: ChartingLibraryWidgetOptions['client_id']) {
        this._clientId = clientId || this._clientId;
    }

    @Input()
    set userId(userId: ChartingLibraryWidgetOptions['user_id']) {
        this._userId = userId || this._userId;
    }

    @Input()
    set fullscreen(fullscreen: ChartingLibraryWidgetOptions['fullscreen']) {
        this._fullscreen = fullscreen || this._fullscreen;
    }

    @Input()
    set autosize(autosize: ChartingLibraryWidgetOptions['autosize']) {
        this._autosize = autosize || this._autosize;
    }

    @Input()
    set containerId(containerId: ChartingLibraryWidgetOptions['container_id']) {
        this._containerId = containerId || this._containerId;
    }

    constructor(
        private tradeHistory: TradeHistoryService,
        private socketService: SocketService
    ) {
        this.loadTradingViewData();
    }

    public ngOnInit(): void {
    //    console.log(Datafeed.getBars());
        const widgetOptions = {
            // debug: false,
            symbol: this._symbol,
            // symbol: 'Coinbase:BTC/USD',
            datafeed: this.Datafeed, // our datafeed object
            // datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(this._datafeedUrl),
            interval: this._interval,
            container_id: this._containerId,
            library_path: this._libraryPath,
            locale: this.getLanguageFromURL() || 'en',
            disabled_features: ['use_localstorage_for_settings'],
            enabled_features: [], // []
            charts_storage_url: this._chartsStorageUrl, // 추가
            client_id: this._clientId,
            user_id: this._userId,
            fullscreen: this._fullscreen,
            autosize: this._autosize,
            overrides: {
                'mainSeriesProperties.showCountdown': true, // 추가
                'paneProperties.background': '#131722',
                'paneProperties.vertGridProperties.color': '#363c4e',
                'paneProperties.horzGridProperties.color': '#363c4e',
                'symbolWatermarkProperties.transparency': 90,
                'scalesProperties.textColor' : '#AAA',
                'mainSeriesProperties.candleStyle.wickUpColor': '#336854',
                'mainSeriesProperties.candleStyle.wickDownColor': '#7f323f',
            }
        };

        // console.log('widgetOptions', widgetOptions);
        /*
        const widgetOptions: ChartingLibraryWidgetOptions = {
            symbol: this._symbol,
            datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(this._datafeedUrl),
            interval: this._interval,
            container_id: this._containerId,
            library_path: this._libraryPath,
            locale: getLanguageFromURL() || 'en',
            disabled_features: ['use_localstorage_for_settings'],
            enabled_features: ['study_templates'],
            charts_storage_url: this._chartsStorageUrl,
            charts_storage_api_version: this._chartsStorageApiVersion,
            client_id: this._clientId,
            user_id: this._userId,
            fullscreen: this._fullscreen,
            autosize: this._autosize,
        };
        */

        const tvWidget = new widget(widgetOptions);
        this._tvWidget = tvWidget;

        tvWidget.onChartReady(() => {
            tvWidget.headerReady().then(() => {
                const button = tvWidget.createButton();
                button.setAttribute('title', 'Click to show a notification popup');
                button.classList.add('apply-common-tooltip');
                button.addEventListener('click', () => tvWidget.showNoticeDialog({
                        title: 'Notification',
                        body: 'TradingView Charting Library API works correctly',
                        callback: () => {
                            console.log('Noticed!');
                        },
                    }));
                button.innerHTML = 'Check API';
            });
        });
    }

    public ngOnDestroy(): void {
        if (this._tvWidget !== null) {
            this._tvWidget.remove();
            this._tvWidget = null;
        }
    }

    private getLanguageFromURL(): LanguageCode | null {
        const regex = new RegExp('[\\?&]lang=([^&#]*)');
        const results = regex.exec(location.search);

        return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' ')) as LanguageCode;
    }


    // 아래 부분 부터 추가 되는 내용 (기존의 index.ts) 나중에 보고 별도로 분리
/*
    private Datafeed: IBasicDataFeed;
    timezone: Timezone = 'Etc/UTC';
    supportedResolutions: string[] = ['1', '3', '5', '15', '30', '60', '120', '240','720'];
    historyDepthReturn: HistoryDepth;
    config = {
        supported_resolutions: this.supportedResolutions
    };
    */
    private loadTradingViewData(): void {
        this.Datafeed = {
            onReady: (cb) => {
                console.log('Inside on ready');
                setTimeout(() => cb(this.config), 0);
            },
            searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
                console.log('Search Symbols running');
            },
            resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {

                console.log('ResolveSymbol running');

                const splitData = symbolName.split(/[:/]/);

                const symbolStub = {
                    name: symbolName,
                    description: `${splitData[1]}/${splitData[2]}`,
                    type: 'crypto',
                    session: '24x7',
                    timezone: this.timezone,
                    ticker: symbolName,
                    exchange: splitData[0],
                    minmov: 1,
                    pricescale: 100000000,
                    has_intraday: true,
                    intraday_multipliers: ['1', '60'],
                    supported_resolutions: this.supportedResolutions,
                    volume_precision: 8,
                    //  full_name: 'full_name',
                    //  listed_exchange: 'listed_exchange',
                    // data_status: 'streaming',

                    full_name: null, // 에러로 추가
                    listed_exchange: null,
                    format: null
                };

                // symbolStub.pricescale = 100;
                if (splitData[2].match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
                    symbolStub.pricescale = 100;
                }

                setTimeout(() => {
                    onSymbolResolvedCallback(symbolStub);
                    console.log('Resolved Symbol ', JSON.stringify(symbolStub));
                }, 0);
            },
            getBars: (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) => {
                console.log('getBars method running');
                console.log('symbolinfo ' + JSON.stringify(symbolInfo) + ' resolution ' + resolution + ' from ' + from + ' to ' + to);
                // console.log('function args',arguments)
                // console.log(`Requesting bars between ${new Date(from * 1000).toISOString()} and ${new Date(to * 1000).toISOString()}`)
                const splitSymbol = symbolInfo.name.split(/[:/]/);
                if (resolution === '1D') {
                    resolution = '1440';
                }
                if (resolution === '3D') {
                    resolution = '4320';
                }
                // sending 2000 default limit
                this.tradeHistory.getBars(symbolInfo, resolution, from, to, firstDataRequest, 2000).then((data) => {
                    console.log({data});
                    if (data.Response && data.Response === 'Error') {
                        console.log('CryptoCompare data fetching error :', data.Message);
                        onHistoryCallback([], {noData: true});
                    }
                    if (data.Data.length) {
                        const bars = data.Data.map((el) => {
                            return {
                                time: el.time * 1000,
                                low: el.low,
                                high: el.high,
                                open: el.open,
                                close: el.close,
                                volume: el.volumefrom
                            };
                        });

                        if (firstDataRequest) {
                            const lastBar = bars[bars.length - 1];
                            history[symbolInfo.name] = {lastBar};
                        }

                        if (bars.length) {
                            onHistoryCallback(bars, {noData: false});
                        } else {
                            onHistoryCallback([], {noData: true});
                        }
                    } else {
                        onHistoryCallback([], {noData: true});
                    }
                });
            },
            subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
                console.log('subscribeBars Runnning');
                this.socketService.subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback, history);
            },
            unsubscribeBars: (subscriberUID) => {
                console.log('unsubscribeBars Running');

                this.socketService.unsubscribeBars(subscriberUID);
            },
            calculateHistoryDepth: (resolution: ResolutionString, resolutionBack: ResolutionBackValues, intervalBack: number): HistoryDepth | undefined => {
                console.log('calculate History depth is running ');
                console.log('resolution ' + resolution);
                if (resolution === '1D') {
                    return {
                        resolutionBack: 'M',
                        intervalBack: 6
                    };
                }

                if (resolution === '3D') {
                    return {
                        resolutionBack: 'M',
                        intervalBack: 6
                    };
                }
                if (parseInt(resolution, 10) < 60 ) {
                    // this.historyDepthReturn.resolutionBack = 'D';
                    // this.historyDepthReturn.intervalBack = 1;
                    return {resolutionBack: 'D', intervalBack: 1};
                } else {
                    return undefined;
                }
            },
            getMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
                // optional
                console.log('getMarks Running');
            },
            getTimescaleMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
                // optional
                console.log('getTimeScaleMarks Running');
            },
            getServerTime: (cb) => {
                console.log('getServerTime Running');
            }
        };
    }
}
