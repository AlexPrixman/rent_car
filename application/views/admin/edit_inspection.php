<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Editar Inspeccion</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <?php foreach($inspection as $m){ ?>
        <form action="<?php echo base_url().'home/update_inspection/'.$m->inspection_id; ?>" method="post">
            <input type="hidden" name="inspection_id" value="<?php echo $m->inspection_id; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Vehiculo</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_desc" value="<?php echo $m->car_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cliente</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="customer_desc" value="<?php echo $m->customer_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tiene ralladuras?</label>
                <div class="col-sm-4">
                <select class="form-control" name="is_damaged">
                    <option value="Y"<?php echo ($m->is_damaged==1)?' selected="selected"':'' ?>>Si</option>
                    <option value="N"<?php echo ($m->is_damaged==1)?'':' selected="selected"' ?>>No</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Horario</label>
                <div class="col-sm-10 pt-2">
                    <select class="form-control" name="fuel_level">
                        <option value="1">1/4</option>
                        <option value="2">1/2</option>
                        <option value="3">3/4</option>
                        <option value="4">Lleno</option>
                    </select>          
                </div>
                <?php echo form_error('fuel_level'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tiene goma de repuesto?</label>
                <div class="col-sm-4">
                <select class="form-control" name="spare_tire">
                    <option value="Y"<?php echo ($m->spare_tire==1)?' selected="selected"':'' ?>>Si</option>
                    <option value="N"<?php echo ($m->spare_tire==1)?'':' selected="selected"' ?>>No</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tiene gato hidraulico?</label>
                <div class="col-sm-4">
                <select class="form-control" name="hydraulic_jack">
                    <option value="Y"<?php echo ($m->hydraulic_jack==1)?' selected="selected"':'' ?>>Si</option>
                    <option value="N"<?php echo ($m->hydraulic_jack==1)?'':' selected="selected"' ?>>No</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tiene ralladuras en el cristal?</label>
                <div class="col-sm-4">
                <select class="form-control" name="windows_scratch">
                    <option value="Y"<?php echo ($m->windows_scratch==1)?' selected="selected"':'' ?>>Si</option>
                    <option value="N"<?php echo ($m->windows_scratch==1)?'':' selected="selected"' ?>>No</option>
                </select>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Goma frontal Izquierda</label>
                <div class="col-sm-4">
                <select class="form-control" name="left_front_tire">
                    <option value="B"<?php echo ($m->left_front_tire==1)?' selected="selected"':'' ?>>Bien</option>
                    <option value="D"<?php echo ($m->left_front_tire==1)?'':' selected="selected"' ?>>Detereorada</option>
                </select>
                </div>
                <?php echo form_error('left_front_tire'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Goma frontal Derecha</label>
                <div class="col-sm-4">
                <select class="form-control" name="right_front_tire">
                    <option value="B"<?php echo ($m->right_front_tire==1)?' selected="selected"':'' ?>>Bien</option>
                    <option value="D"<?php echo ($m->right_front_tire==1)?'':' selected="selected"' ?>>Detereorada</option>
                </select>
                </div>
                <?php echo form_error('right_front_tire'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Goma trasera Izquierda</label>
                <div class="col-sm-4">
                <select class="form-control" name="left_rear_tire">
                    <option value="B"<?php echo ($m->left_rear_tire==1)?' selected="selected"':'' ?>>Bien</option>
                    <option value="D"<?php echo ($m->left_rear_tire==1)?'':' selected="selected"' ?>>Detereorada</option>
                </select>
                </div>
                <?php echo form_error('left_rear_tire'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Goma trasera Derecha</label>
                <div class="col-sm-4">
                <select class="form-control" name="right_rear_tire">
                    <option value="B"<?php echo ($m->right_rear_tire==1)?' selected="selected"':'' ?>>Bien</option>
                    <option value="D"<?php echo ($m->right_rear_tire==1)?'':' selected="selected"' ?>>Detereorada</option>
                </select>
                </div>
                <?php echo form_error('right_rear_tire'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Etc.</label>
                <div class="col-sm-10">
                    <textarea name="etc" id="" cols="30" rows="10"><?php echo $m->etc; ?></textarea>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Fecha de la Inspeccion</label>
                <div class="col-sm-10"><input type="date" class="form-control" name="inspection_date" value="<?php echo $m->inspection_date; ?>"></div>
                <?php echo form_error('inspection_date'); ?>
            </div>    
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Empleado</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="employee_desc" value="<?php echo $m->employee_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado de la Renta</label>
                <div class="col-sm-4">
                <select class="form-control" name="inspection_status">
                    <option value="A"<?php echo ($m->inspection_status==1)?' selected="selected"':'' ?>>Aprobada</option>
                    <option value="R"<?php echo ($m->inspection_status==1)?'':' selected="selected"' ?>>Rechazda</option>
                </select>
                </div>
                <?php echo form_error('rental_status'); ?>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Editar</button>
                    <a href="<?php echo base_url().'home/inspections';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
        <?php } ?>
    </div>
</div>