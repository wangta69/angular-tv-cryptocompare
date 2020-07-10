import { Injectable } from '@angular/core';
import * as socketIo from 'socket.io-client';

// const SERVER_URL = 'wss://streamer.cryptocompare.com';
const SERVER_URL = 'wss://streamer.cryptocompare.com/v2';
@Injectable()
export class SocketService {
    private socket: any;
    private _subscriptions = [];
    private channelString: string;
    constructor() {
        this.socket = socketIo(SERVER_URL);
        this.socket.on('connect', () => {
            console.log('=====Socket connected=======');
        });
        this.socket.on('disconnect', (e: any) => {
            console.log('=====Socket disconnected:', e + ' =======');
        });
        this.socket.on('error', (err: any) => {
            console.log('====socket error', err + ' =======');
        });
        this.socket.on('m', (e: any) => {
            // here we get all events the CryptoCompare connection has subscribed to
            // we need to send this new data to our subscribed charts
            const _data = e.split('~');
            if (_data[0] === '3') {
                // console.log('Websocket Snapshot load event complete')
                return;
            }
            const data = {
                sub_type: parseInt(_data[0], 10),
                exchange: _data[1],
                to_sym: _data[2],
                from_sym: _data[3],
                trade_id: _data[5],
                ts: parseInt(_data[6], 10),
                volume: parseFloat(_data[7]),
                price: parseFloat(_data[8])
            };

            const channelString = `${data.sub_type}~${data.exchange}~${data.to_sym}~${data.from_sym}`;

            const sub = this._subscriptions.find((e2: any) => e2.channelString === channelString);

            if (sub) {
                // disregard the initial catchup snapshot of trades for already closed candles
                if (data.ts < sub.lastBar.time / 1000) {
                    return;
                }

                const _lastBar = this.updateBar(data, sub);

                // send the most recent bar back to TV's realtimeUpdate callback
                sub.listener(_lastBar);
                // update our own record of lastBar
                sub.lastBar = _lastBar;
            }
        });
    }

    public initSocket(): void {
    }

    // Take a single trade, and subscription record, return updated bar
    private updateBar(data: any, sub: any): any {
        // alert('update bar from socket service ');
        const lastBar = sub.lastBar;
        let resolution = sub.resolution;
        if (resolution.includes('D')) {
        // 1 day in minutes === 1440
        resolution = 1440;
        } else if (resolution.includes('W')) {
        // 1 week in minutes === 10080
        resolution = 10080;
        }
        const coeff = resolution * 60;
        // console.log({coeff})
        const rounded = Math.floor(data.ts / coeff) * coeff;
        const lastBarSec = lastBar.time / 1000;
        let _lastBar: any;

        if (rounded > lastBarSec) {
            // create a new candle, use last close as open **PERSONAL CHOICE**
            _lastBar = {
                time: rounded * 1000,
                open: lastBar.close,
                high: lastBar.close,
                low: lastBar.close,
                close: data.price,
                volume: data.volume
            };
        } else {
            // update lastBar candle!
            if (data.price < lastBar.low) {
                lastBar.low = data.price;
            } else if (data.price > lastBar.high) {
                lastBar.high = data.price;
            }

            lastBar.volume += data.volume;
            lastBar.close = data.price;
            _lastBar = lastBar;
        }
        // console.log('_lastBar '+JSON.stringify(_lastBar));
        return _lastBar;
    }

    // takes symbolInfo object as input and creates the subscription string to send to CryptoCompare
    private createChannelString(symbolInfo): string {
       const channel = symbolInfo.name.split(/[:/]/);
       const exchange = channel[0] === 'GDAX' ? 'Coinbase' : channel[0];
       const to = channel[2];
       const from = channel[1];
      // subscribe to the CryptoCompare trade channel for the pair and exchange
       return `0~${exchange}~${from}~${to}`;
  }

    public subscribeBars(symbolInfo, resolution, updateCb, uid: string, resetCache, history): void {
        // alert('SubscribeBars from service');
        this.channelString = this.createChannelString(symbolInfo);
        this.socket.emit('SubAdd', {subs: [this.channelString]});
        const a = this.channelString;
        const newSub = {
            channelString: a,
            uid,
            resolution,
            symbolInfo,
            lastBar: history[symbolInfo.name].lastBar,
            listener: updateCb,
        };
        // console.log('newSub '+JSON.stringify(newSub));
        this._subscriptions.push(newSub);
    }

    public unsubscribeBars(uid: string): void {
        // alert('unsubscribe bar from socket service ');
        const subIndex = this._subscriptions.findIndex((e: any) => e.uid === uid);
        if (subIndex === -1) {
            // console.log('No subscription found for ',uid)
            return;
        }
        const sub = this._subscriptions[subIndex];
        this.socket.emit('SubRemove', {subs: [sub.channelString]});
        this._subscriptions.splice(subIndex, 1);
    }
}
