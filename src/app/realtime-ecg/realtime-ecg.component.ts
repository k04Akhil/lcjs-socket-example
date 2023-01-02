import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Point } from "@arction/lcjs";
import { Subject, Subscription } from "rxjs";
import { SocketService } from "../services/socket.service";

@Component({
  selector: "realtime-ecg",
  templateUrl: "./realtime-ecg.component.html",
  styleUrls: ["./realtime-ecg.component.scss"],
})
export class RealtimeEcgComponent implements OnInit {
  loading = false;

  dataPointsPerSecond = 1000; // 1000 Hz
  $updatePoint: Subject<Point[]> = new Subject<Point[]>();
  $allSubs: Subscription = new Subscription();
  ecgData: Point[] = [];
  isDataAvailable = false;

  constructor(private socketService: SocketService, private router: Router) {}

  ngOnInit() {
    this.socketService.connectSocket();
  }

  ngAfterViewInit() {
    this.ecgDataSubscribtion();
  }

  ecgDataSubscribtion() {
    this.$allSubs = this.socketService
      .ecgSubscription()
      .subscribe((res: any) => {
          this.$updatePoint.next(res);
      });
  }

  onClickBack() {
    // this.router.navigateByUrl('pages/ecg');
  }

  ngOnDestroy() {
    this.$allSubs.unsubscribe();
    this.socketService.disconnectSocket();
  }
}
