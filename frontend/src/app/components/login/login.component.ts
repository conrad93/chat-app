import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseService } from 'src/app/services/base.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  isLoading = false;
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private toastService: ToastService, private baseService: BaseService, private router: Router){
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%#*?&])[A-Za-z\\d@$!%#*?&]{8,}$")
      ]]
    });
  }

  onSubmit(){
    this.isLoading = true;
    this.baseService.postMethod(this.loginForm.value, "/api/auth/login", {}).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if(!res.error){
          this.toastService.show({body: "Success", classnames: "bg-success text-white", delay: 3000});
          this.baseService.setLoggedInUser(res);
          this.router.navigate(['/home']);
        } else {
          this.toastService.show({body: res.error, classnames: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.show({body: "Server error", classnames: "bg-danger text-white", delay: 3000});
        console.error(err);
      }
    });
  }
}
