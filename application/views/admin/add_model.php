<br>
<div class="card shadow mb-4">
    <div class="card-body">
        <form method="post" action="<?php echo base_url().'home/add_model_act'; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Descripcion del Modelo</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="model_desc" placeholder="Nombre del Modelo"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado del Modelo</label>
                <div class="col-sm-2">
                    <select class="form-control" name="model_status">
                        <option value="A">Activo</option>
                        <option value="I">Inactivo</option>
                    </select>
                </div>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Registrar</button>
                    <a href="<?php echo base_url().'home/add_car_act';?>" class="btn btn-danger">Cancelar</a>
                </div>
            </div>
        </form>
    </div>
</div>