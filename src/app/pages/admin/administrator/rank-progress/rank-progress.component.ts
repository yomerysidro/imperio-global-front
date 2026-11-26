import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { timer } from 'rxjs';
import { environment } from '@env/environment';
import { HttpService } from '@shared/services/http.service';
import { IResponse } from '@shared/services/interfaces/response.interface';

interface Member {
  id: number;
  name: string;
  uuid: string;
}

interface Rank {
  id: number;
  title: string;
  position: number;
  required_points: number;
  required_frontals: number;
  points_met: boolean;
  required_members_per_branch?: number;
  eligible_branches?: number;
  activation_met?: boolean;
  structure_met?: boolean;
  qualified?: boolean;
  badge_path?: string;
  requirements?: { title: string; count: number; distinct_lines: number }[];
}

interface LineProgress {
  points: number;
  period: string;
  current: Rank | null;
  next: Rank | null;
  ranks: Rank[];
  closes_at?: string;
}

interface RankProgress {
  member: Member;
  can_search_members: boolean;
  server_time: string;
  product: LineProgress;
  service: LineProgress;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NzTabsModule],
  templateUrl: './rank-progress.component.html',
  styleUrls: ['./rank-progress.component.scss'],
})
export class RankProgressComponent implements OnInit {
  private readonly http = inject(HttpService);
  private readonly destroyRef = inject(DestroyRef);
  readonly hostUrl = environment.hostUrl;
  data?: RankProgress;
  members: Member[] = [];
  searchText = '';
  searched = false;
  loading = false;
  searching = false;
  error = '';
  searchError = '';
  private memberId?: number;
  private clockOffset = 0;
  private lastLoad = 0;

  ngOnInit(): void {
    this.load();
    timer(0, 1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.tick());
  }

  load(memberId = this.memberId): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.lastLoad = Date.now();
    this.http.get<IResponse<RankProgress>>('/rank-progress', { params: memberId ? { member_id: memberId } : {} })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.data = response.data;
          this.memberId = memberId;
          this.clockOffset = Date.parse(response.data.server_time) - Date.now();
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo actualizar el progreso.';
          this.loading = false;
        },
      });
  }

  showMyProgress(): void {
    this.memberId = undefined;
    this.load();
  }

  findMembers(): void {
    const search = this.searchText.trim();
    if (search.length < 2 || this.searching) return;
    this.members = [];
    this.searched = false;
    this.searchError = '';
    this.searching = true;
    this.http.get<IResponse<Member[]>>('/rank-progress/members', { params: { search } })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.members = response.data;
          this.searched = true;
          this.searching = false;
        },
        error: () => {
          this.searchError = 'No se pudo buscar socios.';
          this.searching = false;
        },
      });
  }

  private tick(): void {
    const closesAt = this.data?.service.closes_at;
    if (!closesAt) return;
    const interval = Date.parse(closesAt) <= Date.now() + this.clockOffset ? 5000 : 60000;
    if (Date.now() - this.lastLoad >= interval) this.load();
  }

  progress(points: number, target: number): number {
    if (target <= 0) return 0;
    if (points >= target) return 100;
    return Math.min(99.99, Math.max(0, Math.round(10000 * points / target) / 100));
  }
}
