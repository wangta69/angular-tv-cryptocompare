import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppHeaderComponent } from './app-header/app-header.component';
import { TvChartContainerComponent } from './tv-chart-container/tv-chart-container.component';
import { HttpClientModule } from '@angular/common/http';

import { TradeHistoryService } from './services/cryptocompare-tv/trade-history.service';
import { SocketService } from './services/cryptocompare-tv/socket.service';

@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    TvChartContainerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [TradeHistoryService, SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
