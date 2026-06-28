import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer-menu', // O el selector que estés usando
  templateUrl: './footer-menu.component.html',
  styleUrls: ['./footer-menu.component.scss']
})
export class FooterMenuComponent implements OnInit {

  // Esta variable controla si el footer móvil se muestra o no
  footerActive: boolean = true; 

  constructor() { }

  ngOnInit(): void {
  }

  // ==========================================
  // FUNCIONES DE CONTACTO (Para el footer de escritorio y móvil)
  // ==========================================
  goToWhatsApp(): void {
    const phone = '51997245632';
    const message = 'Hola Imperio Global, quisiera más información.';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  }

  goToEmail(): void {
    window.location.href = 'mailto:pascual.seminario@gmail.com';
  }

  // ==========================================
  // FUNCIONES DE REDES SOCIALES (ENLACES CORRECTOS)
  // ==========================================
  goToFacebook(): void {
    // Enlace actualizado según tu código
    window.open('https://www.facebook.com/share/1D6fZzrjkT/', '_blank');
  }

  goToYoutube(): void {
    // Enlace actualizado según tu código
    window.open('https://www.youtube.com/@ImperioGlobalPeru', '_blank');
  }

  goToInstagram(): void {
    // Enlace actualizado con tu código
    window.open('https://www.instagram.com', '_blank');
  }

}