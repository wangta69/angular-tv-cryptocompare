
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable()
export class DataService {

  private result: any;

  constructor(private _http: HttpClient) {}

    // {"BTC":{"USD":9399.83},"ETH":{"USD":245.5},"BCH":{"USD":241.37},"NEO":{"USD":10.91},"LTC":{"USD":44.98},"DASH":{"USD":71.88}}
    // public getPrices(): any {
     // return this._http.get('https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,BCH,NEO,IOT,LTC,DASH,&tsyms=USD')
    //    .pipe(map((result: any) => this.result = result));
    // }

    public getPrices(): any {
    const fsymsList =
      'BTC,XRP,BCH,ETH,ZEC,EOS,XMR,ETC,LTC,DASH,QTUM,NEO,XLM,TRX,ADA,BTS,USDT,XUC,PAX,IOT';
    return this._http
      .get(
        'https://min-api.cryptocompare.com/data/pricemulti?fsyms=' +
          fsymsList +
          '&tsyms=EUR'
      )
      .pipe(map((result) => (this.result = result)));
  }

}
