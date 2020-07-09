import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// import { Observable } from 'rxjs/Observable';
// import 'rxjs/add/observable/throw';
// import 'rxjs/add/operator/map';
// import 'rxjs/add/operator/catch';
@Injectable()
export class TradeHistoryService {
    private baseUrl = 'https://min-api.cryptocompare.com';
    constructor(private http: HttpClient) {}

    private handleError(error: Response): any {
        console.error(error);
        return throwError(error);
    }

    public getBars(symbolInfo, resolution, from, to, first, limit): Promise<any> {
        const splitSymbol = symbolInfo.name.split(/[:/]/);
        const url = resolution === 'D' ? '/data/histoday' : parseInt(resolution, 10) >= 60 ? '/data/histohour' : '/data/histominute';
        const qs = {
            e: splitSymbol[0],
            fsym: splitSymbol[1],
            tsym: splitSymbol[2],
            toTs:  to ? to : '',
            limit: limit ? limit : 2000
        };

        const body: any = {};
        body.params = qs;

        return new Promise((resolve) => {
            this.http.get(`${this.baseUrl}${url}`, body)
            .pipe (
              catchError(this.handleError)
            )
            .subscribe(
                (data) => resolve(data),
                // data => resolve(this.extractData(data)),
                (err) => this.handleError(err)
            );
        });
        /*
        return this.http.get(`${this.baseUrl}${url}`, params)
          .map(res => {
            return res.json();
          })
          .catch(this.handleError)

          */

  }

}
