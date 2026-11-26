import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzFilterOptionType, NzSelectModule } from 'ng-zorro-antd/select';
import { countries, findCountry, normalizeCountryName } from './country-catalog';

const countryOptions = countries.map(country => ({ ...country, value: country.name }));
const countryFlags = new Map(countries.map(country => [country.name, country.flag]));

@Component({
  selector: 'app-country-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: CountrySelectComponent, multi: true }],
  templateUrl: './country-select.component.html',
  styles: [`
    :host { display: block; }
    nz-select { width: 100%; }
    .country-option { display: inline-flex; align-items: center; gap: 8px; }
    .iti__flag { flex: none; }
  `],
})
export class CountrySelectComponent implements ControlValueAccessor {
  @Input() inputId = '';
  @Input() busy = false;

  value: string | null = null;
  disabled = false;
  options = countryOptions;
  flags = countryFlags;
  readonly filterCountry: NzFilterOptionType = (search, option) =>
    normalizeCountryName(String(option.nzLabel ?? '')).includes(normalizeCountryName(search));

  private onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value = value || null;
    this.options = countryOptions;
    this.flags = countryFlags;
    if (!value) return;

    const country = findCountry(value);
    if (country?.name === value) return;

    const saved = { code: country?.code ?? '', name: country?.name ?? value, flag: country?.flag ?? '', value };
    this.options = country
      ? countryOptions.map(option => option.code === country.code ? saved : option)
      : [saved, ...countryOptions];
    this.flags = new Map(countryFlags).set(value, saved.flag);
  }

  select(value: string | null): void {
    this.value = value;
    this.onChange(value);
  }

  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }
}
