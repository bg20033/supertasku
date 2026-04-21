import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

export interface LocationFilterResponse {
  locationId: number;
  zipCode: string;
  locationName: string;
  cantonName: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly http = inject(HttpClient);

  searchLocations(query: string): Observable<LocationFilterResponse[]> {
    if (!query || query.length < 2) {
      return of([]);
    }

    const isNumeric = /^\d+$/.test(query);
    const searchParam = isNumeric
      ? `postalCode=${encodeURIComponent(query + '*')}`
      : `name=${encodeURIComponent(query)}`;

    return this.http
      .get<any>(`https://openplzapi.org/ch/Localities?${searchParam}&pageSize=20`)
      .pipe(
        switchMap((response) => {
          const localities = Array.isArray(response) ? response : response?.results || [];
          const mapped: LocationFilterResponse[] = localities.map((loc: any) => ({
            locationId: parseInt(loc.key) || 0,
            zipCode: loc.postalCode,
            locationName: loc.name,
            cantonName: loc.canton?.shortName || loc.canton?.name || '',
          }));
          return of(mapped);
        }),
        catchError(() => of([])),
      );
  }
}
