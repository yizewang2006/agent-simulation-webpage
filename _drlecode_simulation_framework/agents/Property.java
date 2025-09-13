package agents;

public class Property 
{
	public double value = 0;
	public double value_next = 0;
	public double property_ID = 0;
	
	//Pub is public or local
	//Public means property can be sense by other entity
	//Local means property can only be sensed by entity itself
	public boolean pub = true;
	//Glo is global or local
	//Global means sense not depend on FOV
	//Local means sense depends on FOV
	public boolean glo = false;
	
	public Property()
	{
		
	}
	
	public Property(double ID, double init_value, boolean p, boolean g)
	{
		this.property_ID = ID;
		this.value = init_value;
		this.pub = p;
		this.glo = g;
	}


}
