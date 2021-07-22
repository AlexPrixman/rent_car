<!-- Page Heading -->
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Editar Cliente</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <?php foreach($employee as $k){ ?>
        <form action="<?php echo base_url().'home/update_employee/'.$k->employee_id ?>" method="post">
            <input type="hidden" name="employee_id" value="<?php echo $k->employee_id; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Nombre</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="employee_name" value="<?php echo $k->employee_name; ?>"></div>
                <?php echo form_error('employee_name'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Direccion</label>
                <div class="col-sm-10">
                <textarea class="form-control" name="employee_address" rows="3"><?php echo $k->employee_address; ?></textarea>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Genero</label>
                <div class="col-sm-10 pt-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="employee_gender" value="L"<?php echo ($k->employee_gender=='L') ? ' checked':''; ?>>
                        <label class="form-check-label">Masculino</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="employee_gender" value="P"<?php echo ($k->employee_gender=='L') ? '':' checked'; ?>>
                        <label class="form-check-label">Femenino</label>
                    </div>
                </div>
                <?php echo form_error('employee_status'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Telefono</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="employee_phone" value="<?php echo $k->employee_phone; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cedula</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="employee_cedula" value="<?php echo $k->employee_cedula; ?>"></div>
                <?php echo form_error('employee_cedula'); ?>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Submit</button>
                    <a href="<?php echo base_url().'home/employee';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
        <?php } ?>
    </div>
</div>