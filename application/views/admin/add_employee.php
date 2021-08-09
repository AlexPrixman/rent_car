<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Agregar un Empleado</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <form action="<?php echo base_url().'home/add_employee_act' ?>" method="post">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Nombre</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="employee_name"></div>
                <?php echo form_error('employee_name'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cedula</label>
                <div class="col-sm-10"><input type="number" class="form-control" pattern="/^-?\d+\.?\d*$/" name="employee_cedula" oninput="validity.valid||(value='');" onKeyPress="if(this.value.length==11) return false;"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tanda Laboral</label>
                <div class="col-sm-10 pt-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="employee_schedule" value="M">
                        <label class="form-check-label">Matutina</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="employee_schedule" value="V">
                        <label class="form-check-label">Vespertina</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="employee_schedule" value="N">
                        <label class="form-check-label">Nocturna</label>
                    </div>
                </div>
                <?php echo form_error('employee_status'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Por ciento por Comision</label>
                <div class="col-sm-2"><input type="number" min="0" class="form-control" oninput="validity.valid||(value='');" name="employee_commission"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Fecha de Ingreso</label>
                <div class="col-sm-2"><input type="date" max="2021-08-04" class="form-control" name="employee_hiring_date"></div>
                <?php echo form_error('employee_id'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado del Empleado</label>
                <div class="col-sm-2">
                <select class="form-control" name="employee_status">
                    <option value="A">Activo</option>
                    <option value="I">Inactivo</option>
                </select>
                </div>
                <?php echo form_error('employee_status'); ?>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Registrar</button>
                    <a href="<?php echo base_url().'home/employee';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
    </div>
</div>