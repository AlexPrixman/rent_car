<br>
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
                <label class="col-sm-2 col-form-label">Cedula</label>
                <div class="col-sm-10">
                <input class="form-control" name="employee_cedula" value="<?php echo $k->employee_cedula; ?> ">
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Horario</label>
                <div class="col-sm-10 pt-2">
                    <select class="form-control" name="employee_schedule">
                        <option value="M">Matutino</option>
                        <option value="V">Vespertino</option>
                        <option value="N">Nocturno</option>
                    </select>          
                </div>
                <?php echo form_error('employee_schedule'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Comsion de Empleado</label>
                <div class="col-sm-10 pt-2"><input type="number" class="form-control" name="employee_commission" value="<?php echo $k->employee_commission; ?>"></div>
                <?php echo form_error('employee_commission'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Feccha de Ingreso</label>
                <div class="col-sm-10"><input type="date" max="2021-08-04" class="form-control" name="employee_hiring_date" value="<?php echo $k->employee_hiring_date; ?>"></div>
                <?php echo form_error('employee_hiring_date'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado</label>
                <div class="col-sm-10 pt-2">
                    <select class="form-control" name="employee_status">
                        <option value="A">Activo</option>
                        <option value="I">Inactivo</option>
                    </select>
                </div>
                <?php echo form_error('employee_schedule'); ?>  
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