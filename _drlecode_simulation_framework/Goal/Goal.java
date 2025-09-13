package Goal;

import java.util.ArrayList;
import java.util.Arrays;

import agents.Position;
import agents.Property;
import agents.Property_category;
import entities.Entity;

public class Goal extends Entity 
{

	public Property type = new Property_category(4,1,true, false, new ArrayList<Double>(Arrays.asList(3.0, 3.1))); 
	public boolean reach = false;
	
	public Goal(double type_v)
	{
		super(3.0);
		this.type.value = type_v;
	}
}
