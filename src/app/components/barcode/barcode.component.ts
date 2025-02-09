import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import JsBarcode from 'jsbarcode'; // Use default import

@Component({
  selector: 'app-barcode',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './barcode.component.html',
  styleUrls: ['./barcode.component.css']
})
export class BarcodeComponent implements OnChanges {
  @Input() code: string = ''; // Código que se convertirá en código de barras
  barcodeImage: string = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['code'] && this.code) {
      this.generateBarcode();
    }
  }

  generateBarcode() {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, this.code, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 16,
        lineColor: '#000',
        width: 2,
        height: 100
      });
    
      this.barcodeImage = canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      this.barcodeImage = '';
    }
  }
}