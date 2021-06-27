<!-- Page Heading -->
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Editar Cliente</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <?php foreach($customer as $k){ ?>
        <form action="<?php echo base_url().'home/edit_employee' ?>" method="post">
            <input type="hidden" name="customer_id" value="<?php echo $k->customer_id; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Nombre</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="customer_name" value="<?php echo $k->customer_name; ?>"></div>
                <?php echo form_error('customer_name'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Direccion</label>
                <div class="col-sm-10">
                <textarea class="form-control" name="customer_address" rows="3"><?php echo $k->customer_address; ?></textarea>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Genero</label>
                <div class="col-sm-10 pt-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="customer_gender" value="L"<?php echo ($k->customer_gender=='L') ? ' checked':''; ?>>
                        <label class="form-check-label">Masculino</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="customer_gender" value="P"<?php echo ($k->customer_gender=='L') ? '':' checked'; ?>>
                        <label class="form-check-label">Femenino</label>
                    </div>
                </div>
                <?php echo form_error('customer_status'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Telefono</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="customer_phone" value="<?php echo $k->customer_phone; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cedula</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="customer_cedula" value="<?php echo $k->customer_cedula; ?>"></div>
                <?php echo form_error('customer_cedula'); ?>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Submit</button>
                </div>
            </div>
        </form>
        <?php } ?>
    </div>
</div>