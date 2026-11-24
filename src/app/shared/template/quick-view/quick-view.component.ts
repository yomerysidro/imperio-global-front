import { Component , DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ThemeConstantService } from '../../services/theme-constant.service';

@Component({
    selector: 'app-quick-view',
    templateUrl: './quick-view.component.html'
})
 


export class QuickViewComponent {
    private readonly destroyRef = inject(DestroyRef);
  
    selectedHeaderColor: string;
    isSideNavDark : boolean;
    isFolded : boolean;

    constructor( private themeService: ThemeConstantService) {}

    ngOnInit(): void {
        this.themeService.isMenuFoldedChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isSideNavDarkChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isDark => this.isSideNavDark = isDark);
        this.themeService.selectedHeaderColor.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(color => this.selectedHeaderColor = color);
    }

    changeHeaderColor() {
        this.themeService.changeHeaderColor(this.selectedHeaderColor)
    }

    toggleSideNavDark() {
        this.themeService.toogleSideNavDark(this.isSideNavDark);
    }

    toggleFold() {
        this.themeService.toggleFold(this.isFolded);
    }
}

