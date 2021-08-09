<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Agregar Cliente</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <form action="<?php echo base_url().'home/add_customer_act' ?>" method="post">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Nombre</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="customer_name"></div>
                <?php echo form_error('customer_name'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Numero de Cedula</label>
                <div class="col-sm-10"><input type="number" class="form-control" name="customer_cedula" maxlength="11" oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength); validity.valid||(value='');" placeholder="xxx-xxxxxxx-x"></div>
                <?php echo form_error('customer_cedula'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tarjeta de Credito</label>
                <div class="col-sm-10"><input type="number" class="form-control" name="customer_cc" maxlength="16" oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength); validity.valid||(value='');" placeholder="xxxx-xxxx-xxxx-xxxx"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Limite de Credito</label>
                <div class="col-sm-2"><input type="number" class="form-control" min="0" name="customer_credit_limit" oninput="validity.valid||(value='');"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tipo de Persona</label>
                <div class="col-sm-10 pt-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="customer_type" value="F">
                        <label class="form-check-label">Fisica</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="customer_type" value="J">
                        <label class="form-check-label">Juridica</label>
                    </div>
                </div>
                <?php echo form_error('customer_type'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado</label>
                <div class="col-sm-2">
                <select class="form-control" name="customer_status">
                    <option value="A">Activo</option>
                    <option value="I">Inactivo</option>
                </select>
                </div>
                <?php echo form_error('customer_status'); ?>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Registrar</button>
                    <a href="<?php echo base_url().'home/customer';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
    </div>
</div>