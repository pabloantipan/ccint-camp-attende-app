import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { ConstantsApiService, type CountryCode, type LocationConstants } from '@shared/services/api/constants-api.service';
import { map, Observable, startWith } from 'rxjs';

/**
 * Custom email validator that matches server-side validation
 */
function emailValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(control.value) ? null : { 'invalidEmail': { value: control.value } };
  };
}

/**
 * Age validator - minimum 11 years old
 */
function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= minAge ? null : { 'minAge': { requiredAge: minAge, actualAge: age } };
  };
}

@Component({
  selector: 'app-personal-data-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './personal-data-step.component.html',
  styleUrls: ['./personal-data-step.component.scss']
})
export class PersonalDataStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly constantsApi = inject(ConstantsApiService);

  protected personalDataForm!: FormGroup;
  protected countryCodes = signal<CountryCode[]>([]);
  protected countries = signal<string[]>([]);
  protected chileanCommunes = signal<string[]>([]);
  protected chileanRegions = signal<string[]>([]);
  protected communesByRegion = signal<{ [key: string]: string[] }>({});
  protected filteredCommunes = signal<string[]>([]);
  protected citiesByCountry = signal<{ [key: string]: string[] }>({});
  protected filteredCities = signal<string[]>([]);
  protected filteredCountries$!: Observable<string[]>;
  protected filteredCities$!: Observable<string[]>;
  protected loading = signal(true);
  protected countryFlags = signal<{ [key: string]: string }>({});
  protected displayDateOfBirth = signal<string>('');

  async ngOnInit(): Promise<void> {
    // Initialize form first with empty data
    this.initForm();

    await this.constantsApi.getLocationConstants().then((constants: LocationConstants) => {
      console.log('Location constants received:', constants);
      this.countryCodes.set(constants.countryCodes);
      this.countries.set(constants.countries);
      this.chileanCommunes.set(constants.chileanCommunes);
      this.chileanRegions.set(constants.chileanRegions);
      console.log('Chilean regions set:', this.chileanRegions());
      this.communesByRegion.set(constants.communesByRegion);
      console.log('Communes by region set:', this.communesByRegion());
      this.citiesByCountry.set(constants.citiesByCountry);

      // Create country name to flag mapping
      const flagMap: { [key: string]: string } = {
        'Argentina': '🇦🇷',
        'Bolivia': '🇧🇴',
        'Brasil': '🇧🇷',
        'Canadá': '🇨🇦',
        'Chile': '🇨🇱',
        'Colombia': '🇨🇴',
        'Ecuador': '🇪🇨',
        'Estados Unidos': '🇺🇸',
        'México': '🇲🇽',
        'Paraguay': '🇵🇾',
        'Perú': '🇵🇪',
        'Uruguay': '🇺🇾',
        'Venezuela': '🇻🇪',
      };
      this.countryFlags.set(flagMap);

      // Reinitialize cities for the current country
      this.onCountryChange(this.personalDataForm.get('country')!.value);

      // Initialize communes based on saved region
      const savedRegion = this.personalDataForm.get('region')?.value;
      if (savedRegion) {
        this.onRegionChange(savedRegion);
      }

    }).catch((error) => {
      console.error('Failed to load location constants:', error);
    }).finally(() => {
      console.log('Country codes loaded:', this.countryCodes());
      this.loading.set(false);
    });
  }

  private initForm(): void {
    const savedData = this.getSavedData();

    // Convert saved date (mm/dd/yyyy) to display format (dd/mm/yyyy)
    if (savedData?.dateOfBirth) {
      this.displayDateOfBirth.set(this.convertToDisplayFormat(savedData.dateOfBirth));
    }

    this.personalDataForm = this.fb.group({
      firstName: [savedData?.firstName || '', Validators.required],
      lastName: [savedData?.lastName || '', Validators.required],
      dateOfBirth: [savedData?.dateOfBirth || '', [Validators.required, minAgeValidator(11)]],
      gender: [savedData?.gender || '', Validators.required],
      countryCode: [savedData?.countryCode || '+56', Validators.required],
      phone: [savedData?.phone || '', [Validators.required, Validators.pattern(/^\d[\d\s]*$/)]],
      email: [savedData?.email || '', [Validators.required, emailValidator()]],
      address: [savedData?.address || '', Validators.required],
      country: [savedData?.country || 'Chile', Validators.required],
      region: [savedData?.region || ''],
      city: [savedData?.city || '', Validators.required],
      state: [savedData?.state || ''],
    });

    // Set up autocomplete filtering
    this.filteredCountries$ = this.personalDataForm.get('country')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCountries(value || ''))
    );

    this.filteredCities$ = this.personalDataForm.get('city')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCities(value || ''))
    );

    // Update cities when country changes
    this.personalDataForm.get('country')!.valueChanges.subscribe(country => {
      this.onCountryChange(country);
    });

    // Update communes when region changes
    this.personalDataForm.get('region')!.valueChanges.subscribe(region => {
      this.onRegionChange(region);
    });

    // Initialize cities
    this.onCountryChange(this.personalDataForm.get('country')!.value);
  }

  private _filterCountries(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countries().filter(country => country.toLowerCase().includes(filterValue));
  }

  private _filterCities(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.filteredCities().filter(city => city.toLowerCase().includes(filterValue));
  }

  protected onCountryChange(country: string): void {
    const cities = this.citiesByCountry()[country] || [];
    this.filteredCities.set(cities);

    const currentCity = this.personalDataForm.get('city')!.value;
    if (!cities.includes(currentCity)) {
      this.personalDataForm.patchValue({ city: '' });
    }

    const regionControl = this.personalDataForm.get('region')!;
    const stateControl = this.personalDataForm.get('state')!;

    if (country === 'Chile') {
      regionControl.setValidators([Validators.required]);
      stateControl.setValidators([Validators.required]);
    } else {
      regionControl.clearValidators();
      regionControl.setValue('');
      stateControl.clearValidators();
      stateControl.setValue('');
      this.filteredCommunes.set([]);
    }
    regionControl.updateValueAndValidity();
    stateControl.updateValueAndValidity();
  }

  protected onRegionChange(region: string): void {
    const communes = this.communesByRegion()[region] || [];
    this.filteredCommunes.set(communes);

    const currentCommune = this.personalDataForm.get('state')!.value;
    if (!communes.includes(currentCommune)) {
      this.personalDataForm.patchValue({ state: '' });
    }
  }

  protected isChile(): boolean {
    return this.personalDataForm.get('country')?.value === 'Chile';
  }

  protected getCountryFlag(country: string): string {
    return this.countryFlags()[country] || '';
  }

  protected clearCountry(): void {
    this.personalDataForm.patchValue({ country: '' });
    this.personalDataForm.get('country')?.markAsUntouched();
  }

  protected clearCity(): void {
    this.personalDataForm.patchValue({ city: '' });
    this.personalDataForm.get('city')?.markAsUntouched();
  }

  protected clearGender(): void {
    this.personalDataForm.patchValue({ gender: '' });
    this.personalDataForm.get('gender')?.markAsUntouched();
  }

  protected clearRegion(): void {
    this.personalDataForm.patchValue({ region: '' });
    this.personalDataForm.get('region')?.markAsUntouched();
  }

  protected clearState(): void {
    this.personalDataForm.patchValue({ state: '' });
    this.personalDataForm.get('state')?.markAsUntouched();
  }

  /**
   * Convert date from storage format (mm/dd/yyyy) to display format (dd/mm/yyyy)
   */
  private convertToDisplayFormat(dateStr: string): string {
    if (!dateStr) return '';

    // If already in yyyy-mm-dd format (from date input), convert to dd/mm/yyyy
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    // If in mm/dd/yyyy format, convert to dd/mm/yyyy
    const [month, day, year] = dateStr.split('/');
    return `${day}/${month}/${year}`;
  }

  /**
   * Convert date from display format (dd/mm/yyyy) to storage format (mm/dd/yyyy)
   */
  private convertToStorageFormat(dateStr: string): string {
    if (!dateStr) return '';

    // If in yyyy-mm-dd format (from date input), convert to mm/dd/yyyy
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${month}/${day}/${year}`;
    }

    // If in dd/mm/yyyy format, convert to mm/dd/yyyy
    const [day, month, year] = dateStr.split('/');
    return `${month}/${day}/${year}`;
  }

  /**
   * Handle date of birth input change
   */
  protected onDateOfBirthChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value; // yyyy-mm-dd format from date input

    if (value) {
      // Convert yyyy-mm-dd to mm/dd/yyyy for storage
      const storageFormat = this.convertToStorageFormat(value);
      this.personalDataForm.patchValue({ dateOfBirth: storageFormat }, { emitEvent: false });

      // Update display format signal
      this.displayDateOfBirth.set(this.convertToDisplayFormat(value));
    } else {
      this.personalDataForm.patchValue({ dateOfBirth: '' }, { emitEvent: false });
      this.displayDateOfBirth.set('');
    }
  }

  /**
   * Get date value for the input field (yyyy-mm-dd format)
   */
  protected getDateInputValue(): string {
    const dateOfBirth = this.personalDataForm.get('dateOfBirth')?.value;
    if (!dateOfBirth) return '';

    // Convert mm/dd/yyyy to yyyy-mm-dd for input field
    const [month, day, year] = dateOfBirth.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  protected onNext(): void {
    if (this.personalDataForm.invalid) {
      Object.keys(this.personalDataForm.controls).forEach(key => {
        this.personalDataForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saveData(this.personalDataForm.value);
    this.router.navigate(['/registry/medical-info']);
  }

  private getSavedData(): any {
    const data = sessionStorage.getItem('registrationPersonalData');
    return data ? JSON.parse(data) : null;
  }

  private saveData(data: any): void {
    sessionStorage.setItem('registrationPersonalData', JSON.stringify(data));
  }
}
