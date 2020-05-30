import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
import { ElectronService } from '../../core/services'
import { NbDialogService } from '@nebular/theme'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { DefaultModalComponent } from '../../shared/components'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  separatingSize: { value: number, min: number, max: number } = { value: null, min: 100, max: 5000 }
  isEdit: boolean
  form: FormGroup

  get exStatus() {
    return getStatus(this.eS.exValue)
  }

  get indexStatus() {
    return getStatus(this.eS.indexed.perc)
  }

  constructor(
    private _location: Location,
    private eS: ElectronService,
    readonly nz: NgZone,
    private dialogService: NbDialogService,
  ) {}

  @ViewChild('indexing', { static: true }) accordion
  @ViewChild('modal', { static: true }) modal

  ngOnInit(): void {
    this.form = new FormGroup({
      size: new FormControl(null, [
        Validators.required,
        Validators.min(this.separatingSize.min),
        Validators.max(this.separatingSize.max),
      ])
    })

    this.eS.ipcRenderer.on('progress', this.onProgress)
    this.accordion.toggle()
    this.getSeparatingSize()
    this.isEdit = false
  }

  myCL(msg) {
    console.log(msg);
  }

  ngOnDestroy(): void {
    this.eS.ipcRenderer.off('progress', this.onProgress)
  }

  onProgress = (event, { extracted, indexed }) => {
    this.nz.run(() => {
      extracted && (this.eS.exValue = extracted)
      if (indexed?.count) {
        this.eS.indexed.current = indexed.count
        this.eS.indexed.max && (this.eS.indexed.perc = Math.round( indexed.count / this.eS.indexed.max * 100))
      }
      indexed?.length && (this.eS.indexed.max = indexed.length)
    })
  }

  reindex() {
    this.eS.isReindexing = true
    this.eS.exValue = 0
    this.eS.indexed = { current: 0, perc: 0, max: 100 }
    this.eS.reindex().then((args: { files?: string[], empty?: boolean }) => {
      if (!args?.empty) {
        this.eS.filesList = args?.files
      } else {
        this.dialogService.open(DefaultModalComponent, {
          context: {
            title: 'Неможливо почати індексування!',
            text: 'Документи відсутні! Для того щоб почати індексування, помістіть документи в архів (папка documents в директорії з програмою).'
          },
        });
      }
      this.eS.getIndexedFiles()
      this.eS.isReindexing = false
    })
  }

  changeIndexingDirectory() {
    this.eS.exValue = 0
    this.eS.changeIndexingDirectory().then((data) => {
      console.log({data})
    })
  }

  goBack() {
    this._location.back()
  }

  editSeparatingSize() {
    if (this.isEdit && this.form.valid) {
      this.setSeparatingSize(this.form.get('size').value)
    }
    this.isEdit = !this.isEdit
  }

  getSeparatingSize() {
    this.eS.storage.get('search-settings', (error, { separatedSize }: { separatedSize: number }) => {
      if (error) throw error

      this.separatingSize.value = separatedSize
      this.form.get('size').patchValue(separatedSize)
    })
  }

  setSeparatingSize(size: number) {
    this.separatingSize.value = size;
    this.eS.storage.set('search-settings', { separatedSize: size }, (error) => {
      if (error) throw error
    })
  }

  viewFilesList() {
    this.dialogService.open(DefaultModalComponent, {
      context: {
        title: 'Список проіндексованих документів',
        template: this.modal
      },
    });
  }
}

const getStatus = (value) => {
  if (value <= 33) {
    return 'danger'
  } else if (value <= 66) {
    return 'warning'
  } else if (value <= 99) {
    return 'info'
  } else {
    return 'success'
  }
}
