import { Injectable } from '@angular/core';

export enum Roles {
  ADMIN,
  EDITOR,
  USER
}

export interface DropdownOption {
  key: string | number | boolean;
  value: string | number;
  data?: Record<string, any>;
  disabled?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OptionsHelperService {
  constructor() { }

  /////////////////////////////
  // STATIC DROPDOWN OPTIONS //
  /////////////////////////////
  readonly booleanOptions: DropdownOption[] = [
    { key: true, value: 'Áno' },
    { key: false, value: 'Nie' },
  ];

  //////////////////////
  // SEARCH FUNCTIONS //
  //////////////////////
  // readonly searchKurz = (query: string, additionalParam?: KurzListRequestFilter): Observable<DropdownOption[]> => {
  //   return this._pracovneCestyKurzService.filterKurz({ page: 0, limit: 10, filter: { menaId: Number(query), ...additionalParam } }).pipe(
  //     map(
  //       (response) =>
  //         response.result?.map((x) => {
  //           return { key: x.id ?? '', value: x.hodnota?.toString() ?? '', data: x };
  //         }) ?? [],
  //     ),
  //   );
  // };
  // searchKurzWithParam(additionalParam: KurzListRequestFilter): (query: string) => Observable<DropdownOption[]> {
  //   return (query: string): Observable<DropdownOption[]> => this.searchKurz(query, additionalParam);
  // }
}
