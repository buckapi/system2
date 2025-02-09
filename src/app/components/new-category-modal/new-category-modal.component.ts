import { Component, Optional } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { GlobalService } from '../../services/global.service';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';

@Component({
  selector: 'app-new-category-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './new-category-modal.component.html',
  styleUrl: './new-category-modal.component.css'
})
export class NewCategoryModalComponent {
  categoryForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    @Optional() private dialogRef: MatDialogRef<NewCategoryModalComponent>,
    private global: GlobalService,
    private pb: AuthPocketbaseService

  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.categoryForm.valid) {
      try {
        // Create the category in PocketBase using the auth service
        const data = {
          name: this.categoryForm.value.name
        };
        
        await this.pb.getCollection('categorias').create(data);
        // O si tienes un método específico en el servicio:
        // await this.pb.createCategory(data);
        
        // Close the dialog with the form value
        if (this.dialogRef) {
          this.dialogRef.close(this.categoryForm.value);
        }
      } catch (error) {
        console.error('Error creating category:', error);
        // Here you might want to add error handling, like showing a message to the user
      }
    }
  }

  onCancel() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
