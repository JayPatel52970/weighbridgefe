import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CameraSettings, CameraKind, CameraProtocol } from '../../../core/models';

@Component({
  selector: 'app-cameras',
  templateUrl: './cameras.component.html',
  standalone: false
})
export class CamerasComponent implements OnInit {
  siteId = 1;
  cameras: CameraSettings[] = [];
  loading = false;
  editCamera: CameraSettings | null = null;
  saving = false;
  error = '';

  CameraKind = CameraKind;
  CameraProtocol = CameraProtocol;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getCameras(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: r => { this.cameras = r; this.cdr.markForCheck(); } });
  }

  openForm(cam?: CameraSettings): void {
    this.error = '';
    this.editCamera = cam ? { ...cam } : {
      siteId: this.siteId, kind: CameraKind.Vehicle,
      enabled: true, protocol: CameraProtocol.HttpSnapshot,
      timeoutSeconds: 5, storageFolder: 'tickets'
    };
  }

  save(): void {
    if (!this.editCamera) return;
    this.error = '';
    this.saving = true;
    this.cdr.markForCheck();
    this.api.saveCamera(this.editCamera)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.editCamera = null; this.load(); },
        error: err => { this.error = err?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }

  delete(cam: CameraSettings): void {
    const kindName = cam.kind === CameraKind.Vehicle ? 'Vehicle' : 'Operator';
    if (!confirm(`Delete ${kindName} camera?`)) return;
    this.api.deleteCamera(this.siteId, kindName).subscribe(() => this.load());
  }
}
