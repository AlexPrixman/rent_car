<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Editar Cliente</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <?php foreach($customer as $k){ ?>
        <form action="<?php echo base_url().'home/update_customer/'.$k->customer_id ?>" method="post">
            <input type="hidden" name="customer_id" value="<?php echo $k->customer_id; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Nombre</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="customer_name" value="<?php echo $k->customer_name; ?>"></div>
                <?php echo form_error('customer_name'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cedula</label>
                <div class="col-sm-10">
                <input type="text" class="form-control" name="customer_cedula" rows="3" value="<?php echo $k->customer_cedula; ?>">
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tarjeta de Credito</label>
                <div class="col-sm-10">
                <input type="text" class="form-control" name="customer_cc" rows="3" value="<?php echo $k->customer_cc; ?>">
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cedula</label>
                <div class="col-sm-10">
                <input type="text" class="form-control" name="customer_credit_limit" rows="3" value="<?php echo $k->customer_credit_limit; ?>">
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tipo de Cliente</label>
                <div class="col-sm-10">
                <input type="text" class="form-control" name="customer_type" rows="3" value="<?php echo $k->customer_type; ?>">
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado del Cliente</label>
                <div class="col-sm-2">
                    <select class="form-control" name="customer_status">
                        <option value="A">Activo</option>
                        <option value="I">Inactivo</option>
                    </select>
                </div>
            </div>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Editar</button>
                    <a href="<?php echo base_url().'home/customer';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
        <?php } ?>
    </div>
</div>