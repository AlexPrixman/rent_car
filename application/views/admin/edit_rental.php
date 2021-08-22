<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Editar Renta</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <?php foreach($rental as $m){ ?>
        <form action="<?php echo base_url().'home/update_rental/'.$m->rental_id; ?>" method="post">
            <input type="hidden" name="rental_id" value="<?php echo $m->rental_id; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Empleado</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="employee_desc" value="<?php echo $m->employee_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Fecha de La Renta</label>
                <div class="col-sm-10"><input type="date" class="form-control" name="rental_date" value="<?php echo $m->rental_date; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Vehiculo</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_desc" value="<?php echo $m->car_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cliente</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="customer_desc" value="<?php echo $m->customer_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Duracion de la Renta</label>
                <div class="col-sm-10"><input type="number" class="form-control" name="rental_time" value="<?php echo $m->rental_time; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Fecha de Entrega</label>
                <div class="col-sm-10"><input type="date" class="form-control" name="return_date" value="<?php echo $m->return_date; ?>"></div>
                <?php echo form_error('return_date'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Cargo por Dia</label>
                <div class="col-sm-10"><input type="number" class="form-control" name="fee_per_day" value="<?php echo $m->fee_per_day; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Comentario</label>
                <div class="col-sm-10">
                    <textarea name="comment" id="" cols="30" rows="10"><?php echo $m->comment; ?></textarea>
                </div>
            </div>    
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado de la Renta</label>
                <div class="col-sm-4">
                <select class="form-control" name="rental_status">
                    <option value="E"<?php echo ($m->rental_status==1)?' selected="selected"':'' ?>>En Proceso</option>
                    <option value="T"<?php echo ($m->rental_status==1)?'':' selected="selected"' ?>>Terminada</option>
                </select>
                </div>
                <?php echo form_error('rental_status'); ?>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Editar</button>
                    <a href="<?php echo base_url().'home/rentals';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
        <?php } ?>
    </div>
</div>