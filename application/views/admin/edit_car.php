<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Editar Vehiculo</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <?php foreach($car as $m){ ?>
        <form action="<?php echo base_url().'home/udpate_car' ?>" method="post">
            <input type="hidden" name="car_id" value="<?php echo $m->$car_id; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Descripcion</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_desc" value="<?php echo $m->car_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Numero de Chasis</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_chasis" value="<?php echo $m->car_chasis; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Numero de Motor</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_engine" value="<?php echo $m->car_engine; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Numero de Placa</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_plate" value="<?php echo $m->car_plate; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tipo de Vehiculo</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="cat_desc" value="<?php echo $m->cat_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Marca del Vehiculo</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="car_brand" value="<?php echo $m->brand_desc; ?>"></div>
                <?php echo form_error('car_brand'); ?>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Modelo de Vehiculo</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="model_desc" value="<?php echo $m->model_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Tipo de Combustible</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="fuel_desc" value="<?php echo $m->fuel_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado del Vehiculo</label>
                <div class="col-sm-10">
                <select class="form-control" name="car_status">
                    <option value="D"<?php echo ($m->car_status==1)?' selected="selected"':'' ?>>Disponible</option>
                    <option value="R"<?php echo ($m->car_status==1)?'':' selected="selected"' ?>>Rentado</option>
                </select>
                </div>
                <?php echo form_error('car_status'); ?>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Editar</button>
                </div>
            </div>
        </form>
        <?php } ?>
    </div>
</div>