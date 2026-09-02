import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Client, ClientService } from '../clients/client.service';
import { Insurance, InsuranceService } from '../insurances/insurance.service';
import { AuthService, AuthUser } from '../auth/auth.service';
import { SystemUser, UserService } from '../users/user.service';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AdminComponent implements OnInit {

  activeSection = 'Visão geral';
  clients: Client[] = [];
  editingClient: Client | null = null;
  formVisible = false;
  feedback = '';
  clientForm: Client = this.emptyClient();
  clientDocumentType: 'CPF' | 'CNPJ' = 'CPF';
  clientSearch = '';
  insurances: Insurance[] = [];
  editingInsurance: Insurance | null = null;
  insuranceFormVisible = false;
  insuranceForm: Insurance = this.emptyInsurance();
  currentUser: AuthUser | null = null;
  users: SystemUser[] = [];
  editingUser: SystemUser | null = null;
  userFormVisible = false;
  userForm: SystemUser = this.emptyUser();
  profileForm = { name: '', username: '', password: '' };

  readonly menuItems = [
    { label: 'Visão geral', icon: '◈' },
    { label: 'Clientes', icon: '◎' },
    { label: 'Seguros', icon: '□' },
    { label: 'Atividades', icon: '↗' },
    { label: 'Corretores', icon: '＋', adminOnly: true }
  ];

  readonly metrics = [
    { label: 'Clientes ativos', value: '0', detail: 'Nenhum cadastro ainda', tone: 'blue' },
    { label: 'Apólices vigentes', value: '0', detail: 'Aguardando seus registros', tone: 'green' },
    { label: 'Renovações próximas', value: '0', detail: 'Próximos 30 dias', tone: 'amber' }
  ];

  readonly insuranceTypes = [
    'Automóvel', 'Empresarial', 'Equipamentos portáteis', 'Financiamento',
    'Pet', 'PME', 'Residencial', 'Saúde', 'Vida'
  ];

  readonly insurers = [
    'Allianz Seguros', 'Amil', 'Azul Seguros', 'Bradesco Seguros',
    'Itaú Seguros', 'Liberty Seguros', 'Mapfre Seguros', 'NotreDame',
    'Porto Seguro', 'Sompo Seguros', 'Suhai', 'SulAmérica',
    'Tokio Marine', 'Zurich Seguros'
  ];

  constructor(
    private readonly clientService: ClientService,
    private readonly insuranceService: InsuranceService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.authService.currentUser().subscribe({
      next: (response) => this.currentUser = response.user
    });
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Bom dia';
    }
    if (hour < 18) {
      return 'Boa tarde';
    }
    return 'Boa noite';
  }

  get userRoleLabel(): string {
    return this.currentUser?.role === 'ADMIN' ? 'Administrador' : 'Corretor';
  }

  get userInitial(): string {
    return (this.currentUser?.name || this.userRoleLabel).charAt(0).toUpperCase();
  }

  get filteredClients(): Client[] {
    const search = this.clientSearch.trim().toLowerCase();
    if (!search) return this.clients;
    return this.clients.filter((client) =>
      [client.name, client.cpf, client.cnpj, client.email, client.phone]
        .some((value) => value?.toLowerCase().includes(search))
    );
  }

  get clientDocumentValue(): string {
    return this.clientDocumentType === 'CPF' ? this.clientForm.cpf || '' : this.clientForm.cnpj || '';
  }

  set clientDocumentValue(value: string) {
    if (this.clientDocumentType === 'CPF') {
      this.clientForm.cpf = value;
      this.clientForm.cnpj = '';
    } else {
      this.clientForm.cnpj = value;
      this.clientForm.cpf = '';
    }
  }

  changeDocumentType(): void {
    if (this.clientDocumentType === 'CPF') {
      this.clientForm.cnpj = '';
    } else {
      this.clientForm.cpf = '';
    }
  }

  get insuranceDatesInvalid(): boolean {
    const startDate = this.insuranceForm.start_date;
    const endDate = this.insuranceForm.end_date;
    return !startDate || !endDate || endDate < startDate;
  }

  get pageTitle(): string {
    return this.activeSection === 'Visão geral'
      ? `${this.greeting}, ${this.currentUser?.name || this.userRoleLabel}`
      : this.activeSection;
  }

  get pageDescription(): string {
    switch (this.activeSection) {
      case 'Clientes': return 'Consulte, cadastre e mantenha os dados da sua carteira.';
      case 'Seguros': return 'Acompanhe apólices, seguradoras e vigências.';
      case 'Corretores': return 'Administre os acessos e perfis da sua equipe.';
      case 'Minha conta': return 'Atualize seus dados de acesso e segurança.';
      default: return 'Organize seus clientes e mantenha cada apólice sob controle.';
    }
  }

  selectSection(label: string): void {
    this.activeSection = label;
    this.feedback = '';
    if (label === 'Clientes') {
      this.loadClients();
    }
    if (label === 'Seguros') {
      this.loadClients();
      this.loadInsurances();
    }
    if (label === 'Corretores') {
      this.loadUsers();
    }
    if (label === 'Minha conta' && this.currentUser) {
      this.profileForm = { name: this.currentUser.name, username: this.currentUser.username, password: '' };
    }
  }

  loadClients(): void {
    this.clientService.list().subscribe({
      next: (clients) => this.clients = clients,
      error: () => this.feedback = 'Não foi possível carregar os clientes.'
    });
  }

  openClientForm(client?: Client): void {
    this.editingClient = client || null;
    this.clientForm = client ? { ...client } : this.emptyClient();
    this.clientDocumentType = client?.cnpj ? 'CNPJ' : 'CPF';
    this.formVisible = true;
    this.feedback = '';
  }

  closeClientForm(): void {
    this.formVisible = false;
    this.editingClient = null;
  }

  saveClient(): void {
    const isEditing = Boolean(this.editingClient?.id);
    const action = isEditing ? 'atualizar' : 'cadastrar';
    if (!window.confirm(`Deseja ${action} o cliente ${this.clientForm.name}?`)) {
      return;
    }
    const request = this.editingClient?.id
      ? this.clientService.update(this.editingClient.id, this.clientForm)
      : this.clientService.create(this.clientForm);

    request.subscribe({
      next: () => {
        this.closeClientForm();
        this.feedback = isEditing ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.';
        this.loadClients();
      },
      error: (error) => this.feedback = error.error?.message || 'Não foi possível salvar o cliente.'
    });
  }

  removeClient(client: Client): void {
    if (!client.id || !window.confirm(`Excluir o cliente ${client.name}?`)) {
      return;
    }
    this.clientService.remove(client.id).subscribe({
      next: () => {
        this.feedback = 'Cliente excluído com sucesso.';
        this.loadClients();
      },
      error: () => this.feedback = 'Não foi possível excluir o cliente.'
    });
  }

  loadInsurances(): void {
    this.insuranceService.list().subscribe({
      next: (insurances) => this.insurances = insurances,
      error: () => this.feedback = 'Não foi possível carregar os seguros.'
    });
  }

  openInsuranceForm(insurance?: Insurance): void {
    this.editingInsurance = insurance || null;
    this.insuranceForm = insurance ? { ...insurance } : this.emptyInsurance();
    this.insuranceFormVisible = true;
    this.feedback = '';
  }

  closeInsuranceForm(): void {
    this.insuranceFormVisible = false;
    this.editingInsurance = null;
  }

  saveInsurance(): void {
    if (!this.insuranceForm.start_date || !this.insuranceForm.end_date || this.insuranceForm.end_date < this.insuranceForm.start_date) {
      this.feedback = 'Informe uma vigência válida: a data final deve ser igual ou posterior à inicial.';
      return;
    }
    const isEditing = Boolean(this.editingInsurance?.id);
    const action = isEditing ? 'atualizar' : 'cadastrar';
    if (!window.confirm(`Deseja ${action} o seguro de ${this.insuranceForm.insurer}?`)) {
      return;
    }
    const request = this.editingInsurance?.id
      ? this.insuranceService.update(this.editingInsurance.id, this.insuranceForm)
      : this.insuranceService.create(this.insuranceForm);

    request.subscribe({
      next: () => {
        this.closeInsuranceForm();
        this.feedback = isEditing ? 'Seguro atualizado com sucesso.' : 'Seguro cadastrado com sucesso.';
        this.loadInsurances();
      },
      error: (error) => this.feedback = error.error?.message || 'Não foi possível salvar o seguro.'
    });
  }

  removeInsurance(insurance: Insurance): void {
    if (!insurance.id || !window.confirm(`Excluir o seguro de ${insurance.client_name || 'cliente'}?`)) {
      return;
    }
    this.insuranceService.remove(insurance.id).subscribe({
      next: () => {
        this.feedback = 'Seguro excluído com sucesso.';
        this.loadInsurances();
      },
      error: () => this.feedback = 'Não foi possível excluir o seguro.'
    });
  }

  private emptyClient(): Client {
    return { name: '', cpf: '', cnpj: '', birth_date: '', address: '', address_number: '', complement: '', email: '', phone: '' };
  }

  private emptyInsurance(): Insurance {
    return { client_id: 0, insurance_type: '', insurer: '', policy_number: '', start_date: '', end_date: '', status: 'ATIVO', notes: '' };
  }

  loadUsers(): void {
    this.userService.list().subscribe({
      next: (users) => this.users = users,
      error: (error) => this.feedback = error.error?.message || 'Não foi possível carregar os corretores.'
    });
  }

  openUserForm(user?: SystemUser): void {
    this.editingUser = user || null;
    this.userForm = user ? { ...user, password: '' } : this.emptyUser();
    this.userFormVisible = true;
    this.feedback = '';
  }

  closeUserForm(): void {
    this.userFormVisible = false;
    this.editingUser = null;
  }

  saveUser(): void {
    const isEditing = Boolean(this.editingUser?.id);
    const action = isEditing ? 'atualizar' : 'criar';
    if (!window.confirm(`Deseja ${action} o usuário ${this.userForm.name}?`)) {
      return;
    }
    const request = this.editingUser?.id
      ? this.userService.update(this.editingUser.id, this.userForm)
      : this.userService.create(this.userForm);
    request.subscribe({
      next: () => {
        this.closeUserForm();
        this.feedback = isEditing ? 'Corretor atualizado com sucesso.' : 'Corretor criado com sucesso.';
        this.loadUsers();
      },
      error: (error) => this.feedback = error.error?.message || 'Não foi possível salvar o corretor.'
    });
  }

  removeUser(user: SystemUser): void {
    if (!user.id || !window.confirm(`Excluir o usuário ${user.name}?`)) return;
    this.userService.remove(user.id).subscribe({
      next: () => { this.feedback = 'Usuário excluído com sucesso.'; this.loadUsers(); },
      error: (error) => this.feedback = error.error?.message || 'Não foi possível excluir o usuário.'
    });
  }

  saveProfile(): void {
    this.authService.updateProfile(this.profileForm).subscribe({
      next: (response) => {
        this.currentUser = response.user;
        this.profileForm.password = '';
        this.feedback = 'Sua conta foi atualizada com sucesso.';
      },
      error: (error) => this.feedback = error.error?.message || 'Não foi possível atualizar sua conta.'
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.redirectToLogin(),
      error: () => this.redirectToLogin()
    });
  }

  private redirectToLogin(): void {
    window.location.href = '/login';
  }

  private emptyUser(): SystemUser {
    return { name: '', username: '', role: 'CORRETOR', active: true, password: '' };
  }

}
