import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder){
    this.loginForm = this.fb.group({
      fullName: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%#*?&])[A-Za-z\\d@$!%#*?&]{8,}$")
      ]],
      confirmPassword: ['', [
        Validators.required,
        this.comparePassword.bind(this)
      ]],
    });
  }

  comparePassword(control: FormControl): {[s: string]: boolean} | null {
    if(this.loginForm?.get('password')?.value !== control.value){
      return {'mismatch': true};
    }
    return null;
  }

  onSubmit(){
    
  }
}
