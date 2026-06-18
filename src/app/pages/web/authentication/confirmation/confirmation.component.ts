import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {

  frmConfirmation!: FormGroup;
  array = [1, 2, 3, 4];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ){}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.frmConfirmation = this.fb.group({});
  }

  onLogin(): void {
    this.router.navigate(['/admin/auth/login']);
  }

}
