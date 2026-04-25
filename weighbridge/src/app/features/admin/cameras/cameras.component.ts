import { Component, OnInit } from '@angular/core';
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

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getCameras(this.siteId).subscribe({
      next: r => { this.cameras = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
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
    this.api.saveCamera(this.editCamera).subscribe({
      next: () => { this.saving = false; this.editCamera = null; this.load(); },
      error: err => { this.saving = false; this.error = err?.error?.message || 'Save failed.'; }
    });
  }

  delete(cam: CameraSettings): void {
    const kindName = cam.kind === CameraKind.Vehicle ? 'Vehicle' : 'Operator';
    if (!confirm(`Delete ${kindName} camera?`)) return;
    this.api.deleteCamera(this.siteId, kindName).subscribe(() => this.load());
  }
}
